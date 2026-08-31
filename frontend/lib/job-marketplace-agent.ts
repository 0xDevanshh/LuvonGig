import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

const idlFactory = ({ IDL }: any) => {
    const JobStatus = IDL.Variant({
        OPEN: IDL.Null,
        CLOSED: IDL.Null,
        ASSIGNED: IDL.Text,
        COMPLETED: IDL.Null,
        PAID: IDL.Null,
    });
    const BudgetType = IDL.Variant({ FIXED: IDL.Null, HOURLY: IDL.Null });
    const ProposalStatus = IDL.Variant({
        PENDING: IDL.Null,
        SHORTLISTED: IDL.Null,
        REJECTED: IDL.Null,
        ACCEPTED: IDL.Null,
    });

    const Job = IDL.Record({
        id: IDL.Text,
        clientId: IDL.Text,
        title: IDL.Text,
        description: IDL.Text,
        requiredSkills: IDL.Vec(IDL.Text),
        budgetType: BudgetType,
        budgetAmount: IDL.Nat,
        status: JobStatus,
        createdAt: IDL.Int,
        freelancerId: IDL.Opt(IDL.Text),
        completedAt: IDL.Opt(IDL.Int),
        clientReview: IDL.Opt(IDL.Text),
        clientRating: IDL.Opt(IDL.Nat),
    });

    const Proposal = IDL.Record({
        id: IDL.Text,
        jobId: IDL.Text,
        freelancerId: IDL.Text,
        coverLetter: IDL.Text,
        bidAmount: IDL.Nat,
        estimatedDeliveryDays: IDL.Nat,
        status: ProposalStatus,
        createdAt: IDL.Int,
    });

    const JobFilter = IDL.Record({
        skills: IDL.Opt(IDL.Vec(IDL.Text)),
        minBudget: IDL.Opt(IDL.Nat),
        maxBudget: IDL.Opt(IDL.Nat),
    });

    return IDL.Service({
        createJob: IDL.Func(
            [IDL.Text, IDL.Text, IDL.Text, IDL.Vec(IDL.Text), BudgetType, IDL.Nat],
            [IDL.Variant({ ok: IDL.Text, err: IDL.Text })],
            []
        ),
        getJobs: IDL.Func(
            [IDL.Opt(JobFilter), IDL.Nat, IDL.Nat],
            [IDL.Record({ jobs: IDL.Vec(Job), total: IDL.Nat })],
            ['query']
        ),
        placeBid: IDL.Func(
            [IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Nat],
            [IDL.Variant({ ok: IDL.Text, err: IDL.Text })],
            []
        ),
        getProposalsByJob: IDL.Func(
            [IDL.Text, IDL.Text],
            [IDL.Variant({ ok: IDL.Vec(Proposal), err: IDL.Text })],
            ['query']
        ),
        updateProposalStatus: IDL.Func(
            [IDL.Text, IDL.Text, ProposalStatus],
            [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
            []
        ),
        getJobById: IDL.Func([IDL.Text], [IDL.Opt(Job)], ['query']),
        updateJob: IDL.Func(
            [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Vec(IDL.Text), BudgetType, IDL.Nat],
            [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
            []
        ),
        deleteJob: IDL.Func(
            [IDL.Text, IDL.Text],
            [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
            []
        ),
        acceptProposal: IDL.Func(
            [IDL.Text, IDL.Text],
            [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
            []
        ),
        getAssignedJobs: IDL.Func(
            [IDL.Text, IDL.Text],
            [IDL.Vec(Job)],
            ['query']
        ),
        completeJob: IDL.Func(
            [IDL.Text, IDL.Text],
            [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
            []
        ),
        submitJobReview: IDL.Func(
            [IDL.Text, IDL.Text, IDL.Nat, IDL.Text],
            [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
            []
        ),
        markJobAsCompleted: IDL.Func(
            [IDL.Text, IDL.Text],
            [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
            []
        ),
        markJobAsPaid: IDL.Func(
            [IDL.Text, IDL.Text],
            [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
            []
        ),
    });
};

const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'http://localhost:4943';
const JOB_MARKETPLACE_CANISTER_ID = process.env.NEXT_PUBLIC_JOB_MARKETPLACE_CANISTER_ID || '';

let agent: HttpAgent | null = null;
let jobMarketplaceActor: any | null = null;

export async function getICAgent(): Promise<HttpAgent> {
    if (!agent) {
        agent = new HttpAgent({
            host: IC_HOST,
            verifyQuerySignatures: false
        });

        if (IC_HOST.includes('localhost')) {
            await agent.fetchRootKey();
        }
    }
    return agent;
}

export async function getJobMarketplaceActor(): Promise<any> {
    if (!jobMarketplaceActor) {
        if (!JOB_MARKETPLACE_CANISTER_ID) {
            console.warn('NEXT_PUBLIC_JOB_MARKETPLACE_CANISTER_ID is not set');
            // Return a dummy or null, pages should handle this
        }
        const agent = await getICAgent();
        const canisterId = Principal.fromText(JOB_MARKETPLACE_CANISTER_ID || 'aaaaa-aa'); // default safe principal

        jobMarketplaceActor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });
    }
    return jobMarketplaceActor;
}

export function serializeBigInts(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(serializeBigInts);
    if (typeof obj === 'object') {
        const serialized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            serialized[key] = serializeBigInts(value);
        }
        return serialized;
    }
    return obj;
}
