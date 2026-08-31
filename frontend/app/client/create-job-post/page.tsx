'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobPostingTabs } from '@/components/client/JobPostingTabs';
import { JobDetailsStep } from '@/components/client/JobPostSteps/JobDetailsStep';
import { OverviewStep } from '@/components/client/JobPostSteps/OverviewStep';
import { ContractLocationStep } from '@/components/client/JobPostSteps/ContractLocationStep';
import { BudgetStep } from '@/components/client/JobPostSteps/BudgetStep';
import { ApplicationStep } from '@/components/client/JobPostSteps/ApplicationStep';
import { useUserContext } from '@/contexts/UserContext';
import { JobPostingFormData, JobPostCreateRequest } from '@/types/job-post';
export default function CreateJobPost() {
  const navigate = useRouter();
  const { profile } = useUserContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<JobPostingFormData>({
    // Overview tab
    jobType: 'Full time or Direct Hire',
    category: '',
    subCategory: '',
    // Job Details tab
    jobTitle: '',
    rolesResponsibilities: '',
    skillsRequired: '',
    benefits: '',
    // Contract tab
    jobRole: 'Internship',
    contractDuration: '3 months',
    experienceLevel: '',
    isContractToHire: 'Yes',
    workplaceType: '',
    location: '',
    // Budget tab
    budget: '24',
    paymentPeriod: 'Per Hour',
    minBudget: '24',
    maxBudget: '24',
    isUnpaidInternship: false,
    isVolunteering: false,
    // Application tab
    applicationCategory: '',
    applicationQuestions: []
  });
  const handleUpdateFormData = (data: Partial<JobPostingFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };
  const handleContinue = async () => {
    switch (activeTab) {
      case 'overview':
        setActiveTab('jobdetails');
        break;
      case 'jobdetails':
        setActiveTab('contract');
        break;
      case 'contract':
        setActiveTab('budget');
        break;
      case 'budget':
        setActiveTab('application');
        break;
      case 'application':
        // Submit the form to backend
        await handleSubmitJobPost();
        break;
    }
  };

  const handleSubmitJobPost = async () => {
    if (!profile?.email) {
      alert('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      // Transform form data to match API format
      const jobData: JobPostCreateRequest = {
        title: formData.jobTitle,
        description: formData.rolesResponsibilities,
        budget: parseInt(formData.maxBudget) || parseInt(formData.budget),
        deadline: formData.contractDuration,
        category: formData.category,
        skills: formData.skillsRequired.split(',').map(skill => skill.trim()).filter(Boolean),
        experience_level: formData.experienceLevel,
        project_type: formData.jobType,
        timeline: formData.contractDuration,
        // Additional fields from form
        sub_category: formData.subCategory,
        benefits: formData.benefits,
        job_role: formData.jobRole,
        is_contract_to_hire: formData.isContractToHire === 'Yes',
        workplace_type: formData.workplaceType,
        location: formData.location,
        payment_period: formData.paymentPeriod,
        is_unpaid_internship: formData.isUnpaidInternship,
        is_volunteering: formData.isVolunteering,
        application_category: formData.applicationCategory,
        application_questions: formData.applicationQuestions
      };

      const response = await fetch('/api/marketplace/job-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profile.email, // Use email as user identifier
          jobData
        })
      });

      const result = await response.json();

      if (result.success) {
        // Navigate to my-job-posts on success
        navigate.push('/client/my-job-posts');
      } else {
        alert(`Error creating job post: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting job post:', error);
      alert('Failed to create job post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
     
      <div className="flex-1 flex flex-col p-6">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Tell us about the job role</h1>
            <div className="text-sm text-gray-600">
              {activeTab === 'overview' ? 'Overview' : 'Projects'} Details:{' '}
              <span className="font-medium">1/5 Done</span>
            </div>
          </div>
          <JobPostingTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="mt-8">
            {activeTab === 'overview' && <OverviewStep formData={formData} updateFormData={handleUpdateFormData} />}
            {activeTab === 'jobdetails' && <JobDetailsStep formData={formData} updateFormData={handleUpdateFormData} />}
            {activeTab === 'contract' && <ContractLocationStep formData={formData} updateFormData={handleUpdateFormData} />}
            {activeTab === 'budget' && <BudgetStep formData={formData} updateFormData={handleUpdateFormData} />}
            {activeTab === 'application' && <ApplicationStep formData={formData} updateFormData={handleUpdateFormData} />}
            <div className="flex justify-center mt-12">
              <button
                onClick={handleContinue}
                disabled={isSubmitting}
                className="px-12 py-3 bg-[#001F3F] text-white rounded-full hover:bg-[#003366] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>;
}