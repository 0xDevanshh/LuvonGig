import { NextRequest, NextResponse } from 'next/server';
import { getJobMarketplaceActor, serializeBigInts } from '@/lib/job-marketplace-agent';

// GET /api/marketplace/job-posts - List job posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // We'll use the new JobMarketplace canister
    const actor = await getJobMarketplaceActor();

    const limit = BigInt(searchParams.get('limit') || '10');
    const offset = BigInt(searchParams.get('offset') || '0');

    // Convert search params to JobFilter
    const skillsParam = searchParams.get('skills');
    const minBudgetParam = searchParams.get('minBudget');
    const maxBudgetParam = searchParams.get('maxBudget');

    const filter: any = {};
    if (skillsParam) filter.skills = [skillsParam.split(',')];
    if (minBudgetParam) filter.minBudget = [BigInt(minBudgetParam)];
    if (maxBudgetParam) filter.maxBudget = [BigInt(maxBudgetParam)];

    // Currently the canister getJobs only returns OPEN jobs. 
    const result = await actor.getJobs(
      Object.keys(filter).length > 0 ? [filter] : [],
      limit,
      offset
    );

    const serialized = serializeBigInts(result);
    console.log('🏛️ Canister response (total jobs):', serialized.total);
    console.log('🏛️ Canister jobs list sample:', serialized.jobs.length ? serialized.jobs[0] : 'Empty');

    // If client_id is provided, filter the results in memory for now
    const clientId = searchParams.get('client_id');
    console.log('🎯 Listing job posts. Filter clientId:', clientId);

    let filteredJobs = serialized.jobs;
    if (clientId) {
      filteredJobs = filteredJobs.filter((job: any) => {
        const isMatch = String(job.clientId) === String(clientId);
        // const statusInfo = typeof job.status === 'object' ? Object.keys(job.status)[0] : job.status;
        // console.log(`  Job ${job.id}: clientId="${job.clientId}", status="${statusInfo}", isMatch=${isMatch}`);
        return isMatch;
      });
    }

    // Enhance jobs with proposal counts if viewing as client
    const enhancedJobs = await Promise.all(filteredJobs.map(async (job: any) => {
      try {
        // Only fetch proposals if we have a clientId (author) context to view them
        if (clientId && String(job.clientId) === String(clientId)) {
          const proposalsResult = await actor.getProposalsByJob(job.id, clientId);
          if ('ok' in proposalsResult) {
            const proposals = proposalsResult.ok;
            return {
              ...job,
              applicationCount: proposals.length,
              proposals: serializeBigInts(proposals) // Optional: include full proposals
            };
          }
        }
        return { ...job, applicationCount: 0 };
      } catch (e) {
        console.error(`Error fetching proposals for job ${job.id}:`, e);
        return { ...job, applicationCount: 0 };
      }
    }));

    console.log(`📊 Returning ${enhancedJobs.length} jobs after filtering and enhancing`);

    return NextResponse.json({
      success: true,
      data: enhancedJobs,
      total: serialized.total
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error listing job posts:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST /api/marketplace/job-posts - Create job post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, jobData } = body;

    if (!userId || !jobData) {
      return NextResponse.json({
        success: false,
        error: 'User ID and job data are required'
      }, { status: 400 });
    }

    const actor = await getJobMarketplaceActor();

    // Map jobData to createJob parameters - handle different form formats
    const budgetRaw = jobData.budget || jobData.maxBudget || 0;
    const budgetFloat = typeof budgetRaw === 'string' ? parseFloat(budgetRaw) : Number(budgetRaw);
    const budgetAmount = BigInt(Math.floor(budgetFloat * 100000000));

    // Determine budget type
    let budgetType: any = { FIXED: null };
    const typeStr = (jobData.budgetType || jobData.payment_period || '').toUpperCase();
    if (typeStr.includes('HOUR') || typeStr === 'HOURLY') {
      budgetType = { HOURLY: null };
    }

    const skills = jobData.skills || [];

    const result = await actor.createJob(
      userId,
      jobData.title,
      jobData.description,
      skills,
      budgetType,
      budgetAmount
    );

    if ('ok' in result) {
      return NextResponse.json({
        success: true,
        data: result.ok
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.err
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error creating job post:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
