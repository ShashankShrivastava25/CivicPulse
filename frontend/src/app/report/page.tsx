'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Upload, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';
import type { PickedLocation } from '@/components/map/LocationPicker';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false, loading: () => <div className="h-80 animate-pulse rounded-lg bg-gray-100" /> });

type Step = 'image' | 'description' | 'category' | 'location' | 'processing' | 'complete' | 'duplicate' | 'error';

interface DuplicateIssue {
  id: string;
  category: string;
  description: string;
  imageUrl?: string;
  distance: number;
  upvotes: number;
  reportedDate: string;
  status: string;
  confidence: number;
}

interface ProcessingStage {
  title: string;
  completed: boolean;
  current: boolean;
}

const CATEGORIES = [
  'Garbage',
  'Drainage',
  'Road Damage',
  'Pothole',
  'Streetlight',
  'Water Leakage',
  'Waterlogging',
  'Sanitation',
  'Public Infrastructure',
  'Other',
];

export default function ReportIssuePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('image');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState('');
  const [error, setError] = useState('');
  const [duplicateIssue, setDuplicateIssue] = useState<DuplicateIssue | null>(null);
  const [rejectedDuplicateId, setRejectedDuplicateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const processingStages: ProcessingStage[] = [
    { title: 'Uploading image', completed: false, current: true },
    { title: 'Analyzing image', completed: false, current: false },
    { title: 'Understanding civic issue', completed: false, current: false },
    { title: 'Searching nearby reports', completed: false, current: false },
    { title: 'Comparing similar complaints', completed: false, current: false },
    { title: 'Checking location', completed: false, current: false },
    { title: 'Result', completed: false, current: false },
  ];

  // Handle image upload
  const handleImageUpload = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
    setStep('description');
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  // Location is now handled entirely by <LocationPicker /> (current location, search, click, drag).

  // Handle form submission
  const handleSubmit = async () => {
    if (!imageFile || !description || !category || latitude === null || longitude === null) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setStep('processing');

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = (e.target?.result as string).split(',')[1];

        const response = await fetch(`${API_BASE}/issues/report`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            category,
            latitude,
            longitude,
            address,
            imageBase64: base64Image,
            notDuplicateOf: rejectedDuplicateId ?? undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Failed to report issue');
          setStep('error');
          setIsSubmitting(false);
          return;
        }

        // Check if duplicate found
        if (data.data?.status === 'DUPLICATE_FOUND') {
          setDuplicateIssue(data.data.existingIssue);
          setStep('duplicate');
        } else if (data.data?.status === 'CREATED') {
          setRejectedDuplicateId(null);
          setStep('complete');
        }

        setIsSubmitting(false);
      };
      reader.readAsDataURL(imageFile);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setStep('error');
      setIsSubmitting(false);
    }
  };

  // Handle duplicate confirmation
  const handleDuplicateConfirm = async (isYes: boolean) => {
    if (isYes && duplicateIssue) {
      setIsSubmitting(true);
      try {
        const response = await fetch(`${API_BASE}/issues/duplicate/confirm`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ existingIssueId: duplicateIssue.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to upvote existing issue');
        }

        setStep('complete');
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        setStep('error');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Reset to create new issue; remember which suggestion the citizen rejected so the
      // resubmitted report records that decision (see DuplicateEvent on the backend).
      setRejectedDuplicateId(duplicateIssue?.id ?? null);
      setDuplicateIssue(null);
      setStep('description');
    }
  };

  // ============ STEP 1: IMAGE ============
  if (step === 'image') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Issue</h1>
            <p className="text-gray-600 mb-8">Help improve your community. Step 1 of 4: Upload Image</p>

            <div className="space-y-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Drag and drop your image</h3>
                <p className="text-gray-600 mb-4">or</p>
                <label className="inline-block">
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                    Choose File
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </label>
                <p className="text-sm text-gray-500 mt-4">JPG, PNG, or WEBP • Max 5MB</p>
              </div>

              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full rounded-lg max-h-96 object-cover" />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <button
                onClick={() => setStep('description')}
                disabled={!imageFile}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Next: Add Description
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ STEP 2: DESCRIPTION ============
  if (step === 'description') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Issue</h1>
            <p className="text-gray-600 mb-8">Help improve your community. Step 2 of 4: Describe the Issue</p>

            <div className="space-y-6">
              {imagePreview && (
                <div className="flex gap-4">
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Image attached</p>
                    <button
                      onClick={() => setStep('image')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Replace Image
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail. Example: 'Garbage has not been collected near the community park for several days. There are plastic bags and waste scattered on the ground.'"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={6}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">Minimum 10 characters</p>
                  <p className={`text-xs font-medium ${description.length >= 10 ? 'text-green-600' : 'text-gray-500'}`}>
                    {description.length}/2000
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('image')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('category')}
                  disabled={description.length < 10}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Next: Select Category
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ STEP 3: CATEGORY ============
  if (step === 'category') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Issue</h1>
            <p className="text-gray-600 mb-8">Help improve your community. Step 3 of 4: Select Category</p>

            <div className="space-y-6">
              {aiSuggestedCategory && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">AI Suggested:</p>
                  <p className="font-medium text-blue-900">{aiSuggestedCategory}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Issue Category *</label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition text-left ${
                        category === cat
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('description')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('location')}
                  disabled={!category}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Next: Set Location
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ STEP 4: LOCATION ============
  if (step === 'location') {
    const picked: PickedLocation | null = latitude !== null && longitude !== null ? { latitude, longitude, address } : null;
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Issue</h1>
            <p className="text-gray-600 mb-8">Help improve your community. Step 4 of 4: Set Location</p>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Please provide the location of the issue. Use your current location, search for an address, or tap the map — then drag the pin to fine-tune it.</p>
              </div>

              <LocationPicker
                value={picked}
                onChange={(loc) => { setLatitude(loc.latitude); setLongitude(loc.longitude); setAddress(loc.address); setError(''); }}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('category')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={latitude === null || longitude === null || isSubmitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Processing...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ PROCESSING ============
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Processing Your Report</h1>

            <div className="space-y-4">
              {processingStages.map((stage, index) => (
                <div key={stage.title} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-100">
                    {stage.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : stage.current ? (
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    ) : (
                      <span className="text-gray-500 text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${stage.current ? 'text-blue-600' : stage.completed ? 'text-green-600' : 'text-gray-500'}`}>
                      {stage.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-gray-600 mt-8">This should only take a few seconds...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============ DUPLICATE ============
  if (step === 'duplicate' && duplicateIssue) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Possible Existing Report Found</h1>
            <p className="text-center text-gray-600 mb-8">
              We found a similar issue reported nearby. Is this the same issue?
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              {duplicateIssue.imageUrl && (
                <img src={duplicateIssue.imageUrl} alt="Issue" className="w-full rounded-lg mb-4 max-h-48 object-cover" />
              )}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Category</p>
                  <p className="font-medium text-gray-900">{duplicateIssue.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Description</p>
                  <p className="text-gray-700">{duplicateIssue.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="font-medium text-gray-900">{duplicateIssue.distance}m away</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Upvotes</p>
                    <p className="font-medium text-gray-900">{duplicateIssue.upvotes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Similarity</p>
                    <p className="font-medium text-gray-900">{duplicateIssue.confidence}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleDuplicateConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
              >
                No, Create New Report
              </button>
              <button
                onClick={() => handleDuplicateConfirm(true)}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Processing...' : 'Yes, Upvote Existing'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ COMPLETE ============
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {duplicateIssue ? 'Thank You!' : 'Report Submitted!'}
            </h1>
            <p className="text-gray-600 mb-8">
              {duplicateIssue
                ? 'Your support has been added to the existing report.'
                : 'Your report has been submitted. Our team will review it soon.'}
            </p>

            <div className="space-y-3">
              <Link
                href={duplicateIssue ? `/issues/${duplicateIssue.id}` : '/dashboard'}
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {duplicateIssue ? 'View Existing Report' : 'Go to Dashboard'}
              </Link>
              <Link
                href="/nearby"
                className="block w-full px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
              >
                View Nearby Issues
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ ERROR ============
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
            <p className="text-gray-600 mb-6">{error || 'An error occurred while processing your report.'}</p>

            <div className="space-y-3">
              <button
                onClick={() => setStep('location')}
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Try Again
              </button>
              <Link
                href="/dashboard"
                className="block w-full px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
