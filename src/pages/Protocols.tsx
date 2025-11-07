import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Download, Trash2, Search, Filter, CheckCircle2, Loader2, XCircle, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { protocolsAPI, patientsAPI } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function Protocols() {
  const navigate = useNavigate();
  const [protocols, setProtocols] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);

  // Patient selection state for Flow 2
  const [selectedProtocolForEligibility, setSelectedProtocolForEligibility] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);

  // Processing tracker state
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const [currentProtocol, setCurrentProtocol] = useState<any>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [processingSteps, setProcessingSteps] = useState([
    { key: 'upload', label: 'Document Upload', description: 'Securely uploading to cloud storage', status: 'pending' as 'pending' | 'active' | 'completed' | 'failed' },
    { key: 'extraction', label: 'Text Extraction', description: 'Extracting content from PDF using OCR', status: 'pending' as 'pending' | 'active' | 'completed' | 'failed' },
    { key: 'analysis', label: 'Medical Analysis', description: 'Identifying medical entities and terminology', status: 'pending' as 'pending' | 'active' | 'completed' | 'failed' },
    { key: 'classification', label: 'Criteria Classification', description: 'Organizing inclusion and exclusion criteria', status: 'pending' as 'pending' | 'active' | 'completed' | 'failed' },
    { key: 'structuring', label: 'Data Structuring', description: 'Converting to searchable format with AI', status: 'pending' as 'pending' | 'active' | 'completed' | 'failed' },
    { key: 'finalization', label: 'Finalization', description: 'Saving and indexing protocol', status: 'pending' as 'pending' | 'active' | 'completed' | 'failed' },
  ]);

  const loadProtocols = useCallback(async () => {
    try {
      const response: any = await protocolsAPI.getAll();
      setProtocols(response.data);
    } catch (error) {
      toast.error('Failed to load protocols');
    }
  }, []);

  const resetProcessingState = useCallback(() => {
    setProcessingStatus('idle');
    setCurrentProtocol(null);
    setUploadFileName('');
    setProcessingSteps([
      { key: 'upload', label: 'Document Upload', description: 'Securely uploading to cloud storage', status: 'pending' },
      { key: 'extraction', label: 'Text Extraction', description: 'Extracting content from PDF using OCR', status: 'pending' },
      { key: 'analysis', label: 'Medical Analysis', description: 'Identifying medical entities and terminology', status: 'pending' },
      { key: 'classification', label: 'Criteria Classification', description: 'Organizing inclusion and exclusion criteria', status: 'pending' },
      { key: 'structuring', label: 'Data Structuring', description: 'Converting to searchable format with AI', status: 'pending' },
      { key: 'finalization', label: 'Finalization', description: 'Saving and indexing protocol', status: 'pending' },
    ]);
  }, []);

  const updateStepStatus = useCallback((stepKey: string, status: 'pending' | 'active' | 'completed' | 'failed') => {
    setProcessingSteps(prev => prev.map(step =>
      step.key === stepKey ? { ...step, status } : step
    ));
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    // Reset and start processing
    resetProcessingState();
    setProcessingStatus('uploading');
    setUploadFileName(file.name);

    try {
      // Step 1: Upload
      updateStepStatus('upload', 'active');
      const response: any = await protocolsAPI.upload(file);
      updateStepStatus('upload', 'completed');

      const trialId = response.data.trialId;
      setCurrentProtocol({ id: trialId, name: file.name });
      setProcessingStatus('processing');

      // Step 2-6: Processing stages
      updateStepStatus('extraction', 'active');

      // Start polling for status
      let pollCount = 0;
      const maxPolls = 60; // 5 minutes max

      const statusPollInterval = setInterval(async () => {
        try {
          pollCount++;
          const statusResponse: any = await protocolsAPI.getStatus(trialId);
          const status = statusResponse.data.status;

          // Update processing steps based on time/progress
          if (pollCount === 2) {
            updateStepStatus('extraction', 'completed');
            updateStepStatus('analysis', 'active');
          } else if (pollCount === 4) {
            updateStepStatus('analysis', 'completed');
            updateStepStatus('classification', 'active');
          } else if (pollCount === 6) {
            updateStepStatus('classification', 'completed');
            updateStepStatus('structuring', 'active');
          }

          if (status === 'completed') {
            clearInterval(statusPollInterval);

            // Complete all remaining steps
            updateStepStatus('structuring', 'completed');
            updateStepStatus('finalization', 'active');

            // Fetch the complete protocol details with criteria
            try {
              const detailsResponse: any = await protocolsAPI.get(trialId);
              const protocolDetails = detailsResponse.data;

              setTimeout(() => {
                updateStepStatus('finalization', 'completed');
                setProcessingStatus('completed');
                setCurrentProtocol(protocolDetails);
                toast.success('Protocol processing completed successfully!');
                loadProtocols();
              }, 1000);
            } catch (error) {
              console.error('Error fetching protocol details:', error);
              setTimeout(() => {
                updateStepStatus('finalization', 'completed');
                setProcessingStatus('completed');
                setCurrentProtocol({ id: trialId, name: file.name });
                toast.success('Protocol processing completed successfully!');
                loadProtocols();
              }, 1000);
            }

          } else if (status === 'failed') {
            clearInterval(statusPollInterval);
            updateStepStatus('extraction', 'failed');
            updateStepStatus('analysis', 'failed');
            updateStepStatus('classification', 'failed');
            updateStepStatus('structuring', 'failed');
            updateStepStatus('finalization', 'failed');
            setProcessingStatus('failed');
            toast.error('Protocol processing failed');

          } else if (pollCount >= maxPolls) {
            clearInterval(statusPollInterval);
            setProcessingStatus('failed');
            toast.warning('Processing is taking longer than expected. Check admin panel for status.');
          }
        } catch (error) {
          console.error('Status polling error:', error);
          clearInterval(statusPollInterval);
          setProcessingStatus('failed');
        }
      }, 5000); // Poll every 5 seconds

    } catch (error) {
      updateStepStatus('upload', 'failed');
      setProcessingStatus('failed');
      toast.error('Failed to upload protocol');
    }
  }, [loadProtocols, resetProcessingState, updateStepStatus]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: processingStatus !== 'idle',
  });

  useEffect(() => {
    loadProtocols();
  }, [loadProtocols]);

  // Load all patients when user wants to select one for eligibility check
  const loadPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    try {
      const response = await patientsAPI.getAll();
      setPatients(response.data || []);
      toast.success(`Loaded ${response.data.length} patients`);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
      setPatients([]);
    } finally {
      setIsLoadingPatients(false);
    }
  }, []);

  const handlePatientSearch = (value: string) => {
    setPatientSearch(value);
  };

  const handleSelectProtocolForEligibility = (protocol: any) => {
    setSelectedProtocolForEligibility(protocol);
    // Load patients when a protocol is selected
    if (patients.length === 0) {
      loadPatients();
    }
  };

  const handlePatientSelected = async (patient: any) => {
    if (!selectedProtocolForEligibility) {
      toast.error('Please select a protocol first');
      return;
    }

    toast.info('Loading complete patient data...');

    try {
      // Fetch full patient details with all FHIR resources from HealthLake
      const response = await patientsAPI.getById(patient.id);
      const fullPatientData = response.data;

      // Navigate to eligibility check page with protocol and patient data
      navigate('/eligibility-check', {
        state: {
          protocolId: selectedProtocolForEligibility.id,
          protocolData: selectedProtocolForEligibility,
          patientId: patient.id,
          fullPatientData: fullPatientData
        }
      });

      toast.success(`Patient ${patient.name} data loaded successfully`);
    } catch (error: any) {
      console.error('Error loading patient details:', error);
      toast.error('Failed to load complete patient data');

      // Fallback: navigate with basic patient data
      navigate('/eligibility-check', {
        state: {
          protocolId: selectedProtocolForEligibility.id,
          protocolData: selectedProtocolForEligibility,
          patientId: patient.id,
          patientData: patient
        }
      });
    }
  };

  const filteredProtocols = protocols.filter((protocol) => {
    const matchesSearch = protocol.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.nctId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || protocol.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedProtocols.length === filteredProtocols.length) {
      setSelectedProtocols([]);
    } else {
      setSelectedProtocols(filteredProtocols.map((p) => p.id));
    }
  };

  const handleSelectProtocol = (id: string) => {
    setSelectedProtocols((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedProtocols.length === 0) {
      toast.error('No protocols selected');
      return;
    }
    toast.success(`Deleted ${selectedProtocols.length} protocol(s)`);
    setProtocols(protocols.filter((p) => !selectedProtocols.includes(p.id)));
    setSelectedProtocols([]);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      Active: 'default',
      Processing: 'secondary',
      Archived: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getStepIcon = (status: 'pending' | 'active' | 'completed' | 'failed') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Protocol Management</h1>
          <p className="text-muted-foreground mt-2">
            Upload, process, and manage clinical trial protocols
          </p>
        </div>
      </div>

      {/* Upload Area or Processing Tracker */}
      <AnimatePresence mode="wait">
        {processingStatus === 'idle' ? (
          <motion.div
            key="upload-area"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Upload Protocol</CardTitle>
                <CardDescription>
                  Upload PDF protocol documents for automated processing and analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isDragActive ? 'Drop the file here' : 'Upload Protocol PDF'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop a PDF file here, or click to browse
                  </p>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="processing-tracker"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-2">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {processingStatus === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : processingStatus === 'failed' ? (
                        <XCircle className="h-6 w-6 text-red-500" />
                      ) : (
                        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                      )}
                      {processingStatus === 'uploading' && 'Uploading Protocol'}
                      {processingStatus === 'processing' && 'Processing Protocol'}
                      {processingStatus === 'completed' && 'Protocol Ready'}
                      {processingStatus === 'failed' && 'Processing Failed'}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <span className="font-medium">{uploadFileName}</span>
                      {currentProtocol?.id && (
                        <span className="ml-2 text-xs">• ID: {currentProtocol.id}</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Processing Steps */}
                  <div className="space-y-3">
                    {processingSteps.map((step, index) => (
                      <motion.div
                        key={step.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                          step.status === 'active' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' :
                          step.status === 'completed' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                          step.status === 'failed' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
                          'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                        }`}
                      >
                        <div className="mt-0.5">
                          {getStepIcon(step.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-sm">{step.label}</h4>
                            <Badge variant={
                              step.status === 'completed' ? 'default' :
                              step.status === 'active' ? 'secondary' :
                              step.status === 'failed' ? 'destructive' :
                              'outline'
                            } className="text-xs">
                              {step.status === 'pending' ? 'Pending' :
                               step.status === 'active' ? 'In Progress' :
                               step.status === 'completed' ? 'Completed' :
                               'Failed'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Completed Protocol Details */}
                  {processingStatus === 'completed' && currentProtocol && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 space-y-4"
                    >
                      {/* Success Header */}
                      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-6 w-6" />
                          Protocol Successfully Processed
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Your protocol has been analyzed and structured. All eligibility criteria have been extracted and are ready for patient matching.
                        </p>
                      </div>

                      {/* Protocol Metadata */}
                      <div className="p-6 bg-card rounded-lg border">
                        <h4 className="font-semibold text-lg mb-4">Protocol Information</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Protocol ID</p>
                            <p className="font-semibold text-primary">{currentProtocol.trial_id || currentProtocol.id}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Processed At</p>
                            <p className="text-sm">{currentProtocol.timestamp ? new Date(currentProtocol.timestamp).toLocaleString() : 'Just now'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Processing Status</p>
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Confidence Metrics */}
                      {currentProtocol.metadata && (
                        <div className="p-6 bg-card rounded-lg border">
                          <h4 className="font-semibold text-lg mb-4">Extraction Quality Metrics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {currentProtocol.metadata.textract_confidence && (
                              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-2">OCR Confidence</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {(currentProtocol.metadata.textract_confidence * 100).toFixed(1)}%
                                </p>
                              </div>
                            )}
                            {currentProtocol.metadata.extraction_confidence && (
                              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Extraction Confidence</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {(currentProtocol.metadata.extraction_confidence * 100).toFixed(1)}%
                                </p>
                              </div>
                            )}
                            {currentProtocol.metadata.overall_confidence && (
                              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Overall Confidence</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                  {(currentProtocol.metadata.overall_confidence * 100).toFixed(1)}%
                                </p>
                              </div>
                            )}
                            {currentProtocol.metadata.total_criteria && (
                              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Total Criteria</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                  {currentProtocol.metadata.total_criteria}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Inclusion Criteria */}
                      {currentProtocol.inclusion_criteria && currentProtocol.inclusion_criteria.length > 0 && (
                        <div className="p-6 bg-card rounded-lg border">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2">
                              <Badge variant="default" className="bg-green-500">
                                {currentProtocol.metadata?.inclusion_count || currentProtocol.inclusion_criteria.length}
                              </Badge>
                              Inclusion Criteria
                            </h4>
                          </div>
                          <div className="space-y-3">
                            {currentProtocol.inclusion_criteria.map((criteria: string, index: number) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex gap-3 p-4 bg-green-50/50 dark:bg-green-950/10 rounded-lg border border-green-200 dark:border-green-800"
                              >
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </div>
                                <p className="text-sm flex-1 text-foreground leading-relaxed">{criteria}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Exclusion Criteria */}
                      {currentProtocol.exclusion_criteria && currentProtocol.exclusion_criteria.length > 0 && (
                        <div className="p-6 bg-card rounded-lg border">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2">
                              <Badge variant="destructive">
                                {currentProtocol.metadata?.exclusion_count || currentProtocol.exclusion_criteria.length}
                              </Badge>
                              Exclusion Criteria
                            </h4>
                          </div>
                          <div className="space-y-3">
                            {currentProtocol.exclusion_criteria.map((criteria: string, index: number) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex gap-3 p-4 bg-red-50/50 dark:bg-red-950/10 rounded-lg border border-red-200 dark:border-red-800"
                              >
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </div>
                                <p className="text-sm flex-1 text-foreground leading-relaxed">{criteria}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Formatted Text */}
                      {currentProtocol.formatted_text && (
                        <div className="p-6 bg-card rounded-lg border">
                          <h4 className="font-semibold text-lg mb-4">Complete Criteria Text</h4>
                          <div className="p-4 bg-muted rounded-lg font-mono text-xs whitespace-pre-wrap">
                            {currentProtocol.formatted_text}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          onClick={resetProcessingState}
                          className="flex-1"
                          size="lg"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Another Protocol
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => window.open(`/protocols/${currentProtocol.trial_id || currentProtocol.id}`, '_blank')}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Failed State */}
                  {processingStatus === 'failed' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-6 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-200 dark:border-red-800"
                    >
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        Processing Failed
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        We encountered an error while processing your protocol. Please try again or contact support if the issue persists.
                      </p>
                      <Button
                        onClick={resetProcessingState}
                        variant="outline"
                        className="w-full"
                      >
                        Try Again
                      </Button>
                    </motion.div>
                  )}

                  {/* Processing indicator */}
                  {(processingStatus === 'uploading' || processingStatus === 'processing') && (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>This may take a few minutes depending on document size...</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flow 2: Select Protocol → Select Patient → Check Eligibility */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Check Patient Eligibility
          </CardTitle>
          <CardDescription>
            Select a protocol and then choose an existing patient to check their eligibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Select Protocol */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Step 1: Select Protocol</label>
            <Select
              value={selectedProtocolForEligibility?.id || ''}
              onValueChange={(value) => {
                const protocol = protocols.find(p => p.id === value);
                handleSelectProtocolForEligibility(protocol);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a protocol..." />
              </SelectTrigger>
              <SelectContent>
                {protocols.map((protocol) => (
                  <SelectItem key={protocol.id} value={protocol.id}>
                    {protocol.nctId} - {protocol.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Select Patient (only show after protocol is selected) */}
          {selectedProtocolForEligibility && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <label className="text-sm font-medium">Step 2: Select Patient</label>
              <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="text-muted-foreground">
                      {isLoadingPatients ? 'Loading patients...' : 'Search and select a patient...'}
                    </span>
                    <Search className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search by patient name or ID..."
                      value={patientSearch}
                      onValueChange={handlePatientSearch}
                    />
                    <CommandList>
                      {isLoadingPatients && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                          Loading patients...
                        </div>
                      )}
                      {!isLoadingPatients && patients.length === 0 && (
                        <CommandEmpty>No patients found. Create patients first.</CommandEmpty>
                      )}
                      {!isLoadingPatients && patients.length > 0 && (
                        <CommandGroup heading={`${patients.filter(p =>
                          !patientSearch ||
                          p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                          p.id.toLowerCase().includes(patientSearch.toLowerCase())
                        ).length} patient(s) found`}>
                          {patients
                            .filter(p =>
                              !patientSearch ||
                              p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                              p.id.toLowerCase().includes(patientSearch.toLowerCase())
                            )
                            .map((patient) => (
                              <CommandItem
                                key={patient.id}
                                onSelect={() => {
                                  handlePatientSelected(patient);
                                  setPatientPopoverOpen(false);
                                }}
                              >
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{patient.name}</span>
                                    <Badge variant="outline" className="text-xs">{patient.gender || 'Unknown'}</Badge>
                                    {patient.age && <Badge variant="secondary" className="text-xs">{patient.age} years</Badge>}
                                  </div>
                                  <span className="text-sm text-muted-foreground">ID: {patient.id}</span>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <p className="text-xs text-muted-foreground">
                Select a patient to view their profile and check eligibility against{' '}
                <span className="font-semibold">{selectedProtocolForEligibility.nctId}</span>
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Protocol Management */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Library</CardTitle>
          <CardDescription>Search, filter, and manage uploaded protocols</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by protocol ID or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedProtocols.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-accent rounded-lg"
            >
              <span className="text-sm font-medium">
                {selectedProtocols.length} protocol(s) selected
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </motion.div>
          )}

          {/* Protocols Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProtocols.length === filteredProtocols.length && filteredProtocols.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Protocol ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Disease</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Screening Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProtocols.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No protocols found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProtocols.map((protocol) => (
                    <TableRow key={protocol.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProtocols.includes(protocol.id)}
                          onCheckedChange={() => handleSelectProtocol(protocol.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{protocol.nctId}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{protocol.title}</TableCell>
                      <TableCell>{protocol.disease}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{protocol.phase}</Badge>
                      </TableCell>
                      <TableCell>{protocol.uploadDate}</TableCell>
                      <TableCell>{getStatusBadge(protocol.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {protocol.enrollmentCurrent}/{protocol.enrollmentTarget}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
