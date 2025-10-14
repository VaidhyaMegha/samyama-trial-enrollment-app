import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, Loader2, CheckCircle2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { protocolsAPI, eligibilityAPI, patientsAPI, matchesAPI } from '@/services/api';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export default function EligibilityCheck() {
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [protocolSearch, setProtocolSearch] = useState('');
  const [protocols, setProtocols] = useState<any[]>([]);
  const [allProtocols, setAllProtocols] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [open, setOpen] = useState(false);

  // Patient selection state
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);

  // Load all protocols on component mount
  useEffect(() => {
    const loadProtocols = async () => {
      setIsLoading(true);
      try {
        const response: any = await protocolsAPI.getAll();
        const fetchedProtocols = response.data || [];
        setAllProtocols(fetchedProtocols);
        setProtocols(fetchedProtocols); // Show all protocols by default
        if (fetchedProtocols.length > 0) {
          toast.success(`Loaded ${fetchedProtocols.length} protocols`);
        }
      } catch (error) {
        console.error('Error loading protocols:', error);
        toast.error('Failed to load protocols');
      } finally {
        setIsLoading(false);
      }
    };

    loadProtocols();
  }, []);

  // Patient data - All 11 FHIR Resources
  const [patientData, setPatientData] = useState({
    // 1. Patient - Demographics
    age: '',
    gender: '',
    birthDate: '',

    // 2. Condition - Diagnoses
    conditions: [] as string[],
    cancerType: '',
    stage: '',
    clinicalStatus: 'active',

    // 3. Observation - Lab Values
    labValues: {
      hemoglobin: '',
      platelets: '',
      creatinine: '',
      alt: '',
      ast: '',
      wbc: '',
      neutrophils: '',
      bilirubin: '',
    },

    // 4. Performance Status
    ecogStatus: '',
    karnofskyScore: '',

    // 5. MedicationStatement - Current Medications
    medications: [] as string[],

    // 6. AllergyIntolerance - Allergies
    allergies: [] as string[],
    allergyCriticality: 'low',

    // 7. Procedure - Prior Treatments/Procedures
    priorTreatments: [] as string[],
    surgeries: [] as string[],

    // 8. Immunization - Vaccination History
    immunizations: [] as string[],

    // 9. FamilyMemberHistory - Family History
    familyHistory: [] as string[],

    // 10. Encounter - Visit History
    encounterType: '',
    lastVisitDate: '',

    // 11. DiagnosticReport - Lab/Imaging Reports
    diagnosticReports: [] as string[],
    imagingFindings: '',
  });

  const handleProtocolSearch = async (value: string) => {
    setProtocolSearch(value);

    // If search is empty, show all protocols
    if (value.length === 0) {
      setProtocols(allProtocols);
      return;
    }

    // Client-side filtering for immediate feedback
    const filtered = allProtocols.filter((p: any) =>
      p.title.toLowerCase().includes(value.toLowerCase()) ||
      p.nctId.toLowerCase().includes(value.toLowerCase()) ||
      p.disease.toLowerCase().includes(value.toLowerCase())
    );
    setProtocols(filtered);

    // Also search backend if query is longer than 2 characters
    if (value.length > 2) {
      setIsSearching(true);
      try {
        const response: any = await protocolsAPI.search(value);
        const backendResults = response.data || [];

        // Merge backend results with client-side results (deduplicating by id)
        const merged = [...backendResults];
        filtered.forEach((p: any) => {
          if (!merged.find((m: any) => m.id === p.id)) {
            merged.push(p);
          }
        });

        setProtocols(merged);
      } catch (error) {
        console.error('Backend search failed:', error);
        // Keep client-side filtered results on error
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleEligibilityCheck = async () => {
    if (!selectedProtocol) {
      toast.error('Please select a protocol');
      return;
    }

    if (!patientData.age || !patientData.gender || !patientData.ecogStatus) {
      toast.error('Please fill in required patient information');
      return;
    }

    setIsChecking(true);
    try {
      const response: any = await eligibilityAPI.check(selectedProtocol.id, patientData);
      setResults(response.data);
      toast.success('Eligibility check completed');
    } catch (error: any) {
      console.error('Eligibility check error:', error);
      toast.error(error.message || 'Failed to check eligibility');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!results || !selectedProtocol) {
      toast.error('No eligibility results available');
      return;
    }

    setIsCreatingMatch(true);
    try {
      const matchData = {
        patient_id: results.patientId || 'TEMP_PATIENT',
        protocol_id: selectedProtocol.id,
        match_score: results.overallConfidence,
        patient_name: `Patient (Age: ${patientData.age}, Gender: ${patientData.gender})`,
        protocol_name: selectedProtocol.title,
        criteria_results: results.criteria,
        notes: `Match created from eligibility check. Overall score: ${results.overallConfidence}%`
      };

      const response = await matchesAPI.create(matchData);

      if (response.success) {
        toast.success('Match created successfully!');
        toast.info('Navigate to Patient Matches to review and approve', { duration: 5000 });
      }
    } catch (error: any) {
      console.error('Error creating match:', error);
      toast.error(error.message || 'Failed to create match');
    } finally {
      setIsCreatingMatch(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-success text-success-foreground';
    if (confidence >= 50) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const treatments = ['Chemotherapy', 'Radiation', 'Immunotherapy', 'Targeted Therapy', 'Surgery', 'Hormone Therapy'];
  const commonMedications = ['Aspirin', 'Metformin', 'Atorvastatin', 'Lisinopril', 'Warfarin', 'Prednisone'];
  const commonAllergies = ['Penicillin', 'Sulfa drugs', 'Aspirin', 'Latex', 'Iodine', 'Peanuts'];
  const commonImmunizations = ['COVID-19', 'Influenza', 'Pneumococcal', 'Hepatitis B', 'MMR', 'HPV'];
  const familyConditions = ['Cancer', 'Heart Disease', 'Diabetes', 'Hypertension', 'Stroke', 'Alzheimer\'s'];
  const commonConditions = ['Diabetes', 'Hypertension', 'Asthma', 'COPD', 'Coronary Artery Disease'];
  const diagnosticReportTypes = ['CT Scan', 'MRI', 'PET Scan', 'X-Ray', 'Ultrasound', 'Blood Test'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Patient Eligibility Check</h1>
        <p className="text-muted-foreground mt-2">
          Search for a protocol and assess patient eligibility
        </p>
      </div>

      {/* Protocol Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Protocol</CardTitle>
          <CardDescription>Search and select a clinical trial protocol</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedProtocol ? (
                  <span>{selectedProtocol.nctId} - {selectedProtocol.title}</span>
                ) : (
                  <span className="text-muted-foreground">Search protocols...</span>
                )}
                <Search className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[600px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search by protocol ID, title, or disease..."
                  value={protocolSearch}
                  onValueChange={handleProtocolSearch}
                />
                <CommandList>
                  {isLoading && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                      Loading protocols...
                    </div>
                  )}
                  {isSearching && !isLoading && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                      Searching...
                    </div>
                  )}
                  {!isLoading && !isSearching && protocols.length === 0 && protocolSearch.length > 0 && (
                    <CommandEmpty>No protocols found matching "{protocolSearch}"</CommandEmpty>
                  )}
                  {!isLoading && protocols.length === 0 && protocolSearch.length === 0 && (
                    <CommandEmpty>No protocols available. Please upload protocols first.</CommandEmpty>
                  )}
                  {!isLoading && protocols.length > 0 && (
                    <CommandGroup heading={protocolSearch ? `${protocols.length} protocol(s) found` : `All ${protocols.length} protocol(s)`}>
                      {protocols.map((protocol) => (
                        <CommandItem
                          key={protocol.id}
                          onSelect={() => {
                            setSelectedProtocol(protocol);
                            setOpen(false);
                            setResults(null);
                          }}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{protocol.nctId}</span>
                              <Badge variant="outline" className="text-xs">{protocol.phase}</Badge>
                              <Badge variant="secondary" className="text-xs">{protocol.disease}</Badge>
                            </div>
                            <span className="text-sm text-muted-foreground line-clamp-1">{protocol.title}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedProtocol && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 border rounded-lg bg-accent/50"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{selectedProtocol.nctId}</h3>
                    <Badge>{selectedProtocol.phase}</Badge>
                    <Badge variant="outline">{selectedProtocol.disease}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedProtocol.title}</p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Patient Data Entry */}
      {selectedProtocol && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Enter patient data for eligibility assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="upload">Upload FHIR JSON</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-4 mt-4">
                {/* 1. Patient Demographics */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">1. Patient Demographics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="Enter age"
                        value={patientData.age}
                        onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={patientData.gender} onValueChange={(value) => setPatientData({ ...patientData, gender: value })}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Birth Date</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={patientData.birthDate}
                        onChange={(e) => setPatientData({ ...patientData, birthDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Conditions */}
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="conditions">
                    <AccordionTrigger>2. Conditions & Diagnoses</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cancerType">Cancer Type</Label>
                            <Input
                              id="cancerType"
                              placeholder="e.g., Advanced Melanoma"
                              value={patientData.cancerType}
                              onChange={(e) => setPatientData({ ...patientData, cancerType: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="stage">Stage</Label>
                            <Select value={patientData.stage} onValueChange={(value) => setPatientData({ ...patientData, stage: value })}>
                              <SelectTrigger id="stage">
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="I">Stage I</SelectItem>
                                <SelectItem value="II">Stage II</SelectItem>
                                <SelectItem value="III">Stage III</SelectItem>
                                <SelectItem value="IV">Stage IV</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Other Conditions</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {commonConditions.map((condition) => (
                              <div key={condition} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`cond-${condition}`}
                                  checked={patientData.conditions.includes(condition)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setPatientData({
                                        ...patientData,
                                        conditions: [...patientData.conditions, condition],
                                      });
                                    } else {
                                      setPatientData({
                                        ...patientData,
                                        conditions: patientData.conditions.filter((c) => c !== condition),
                                      });
                                    }
                                  }}
                                />
                                <Label htmlFor={`cond-${condition}`} className="text-sm font-normal cursor-pointer">
                                  {condition}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 3. Observations - Lab Values */}
                  <AccordionItem value="labs">
                    <AccordionTrigger>3. Lab Values & Observations</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="hemoglobin">Hemoglobin (g/dL)</Label>
                          <Input
                            id="hemoglobin"
                            type="number"
                            step="0.1"
                            placeholder="e.g., 12.5"
                            value={patientData.labValues.hemoglobin}
                            onChange={(e) => setPatientData({
                              ...patientData,
                              labValues: { ...patientData.labValues, hemoglobin: e.target.value },
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="platelets">Platelets (×10⁹/L)</Label>
                          <Input
                            id="platelets"
                            type="number"
                            placeholder="e.g., 150"
                            value={patientData.labValues.platelets}
                            onChange={(e) => setPatientData({
                              ...patientData,
                              labValues: { ...patientData.labValues, platelets: e.target.value },
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="creatinine">Creatinine (mg/dL)</Label>
                          <Input
                            id="creatinine"
                            type="number"
                            step="0.1"
                            placeholder="e.g., 1.0"
                            value={patientData.labValues.creatinine}
                            onChange={(e) => setPatientData({
                              ...patientData,
                              labValues: { ...patientData.labValues, creatinine: e.target.value },
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wbc">WBC (×10⁹/L)</Label>
                          <Input
                            id="wbc"
                            type="number"
                            step="0.1"
                            placeholder="e.g., 7.0"
                            value={patientData.labValues.wbc}
                            onChange={(e) => setPatientData({
                              ...patientData,
                              labValues: { ...patientData.labValues, wbc: e.target.value },
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="neutrophils">Neutrophils (%)</Label>
                          <Input
                            id="neutrophils"
                            type="number"
                            placeholder="e.g., 60"
                            value={patientData.labValues.neutrophils}
                            onChange={(e) => setPatientData({
                              ...patientData,
                              labValues: { ...patientData.labValues, neutrophils: e.target.value },
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bilirubin">Bilirubin (mg/dL)</Label>
                          <Input
                            id="bilirubin"
                            type="number"
                            step="0.1"
                            placeholder="e.g., 0.8"
                            value={patientData.labValues.bilirubin}
                            onChange={(e) => setPatientData({
                              ...patientData,
                              labValues: { ...patientData.labValues, bilirubin: e.target.value },
                            })}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 4. Performance Status */}
                  <AccordionItem value="performance">
                    <AccordionTrigger>4. Performance Status *</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="ecog">ECOG Status *</Label>
                          <Select value={patientData.ecogStatus} onValueChange={(value) => setPatientData({ ...patientData, ecogStatus: value })}>
                            <SelectTrigger id="ecog">
                              <SelectValue placeholder="Select ECOG" />
                            </SelectTrigger>
                            <SelectContent>
                              {[0, 1, 2, 3, 4].map((status) => (
                                <SelectItem key={status} value={status.toString()}>
                                  ECOG {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="karnofsky">Karnofsky Score (0-100)</Label>
                          <Input
                            id="karnofsky"
                            type="number"
                            min="0"
                            max="100"
                            step="10"
                            placeholder="e.g., 80"
                            value={patientData.karnofskyScore}
                            onChange={(e) => setPatientData({ ...patientData, karnofskyScore: e.target.value })}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 5. Medications */}
                  <AccordionItem value="medications">
                    <AccordionTrigger>5. Current Medications</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        <Label>Select current medications</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {commonMedications.map((med) => (
                            <div key={med} className="flex items-center space-x-2">
                              <Checkbox
                                id={`med-${med}`}
                                checked={patientData.medications.includes(med)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setPatientData({
                                      ...patientData,
                                      medications: [...patientData.medications, med],
                                    });
                                  } else {
                                    setPatientData({
                                      ...patientData,
                                      medications: patientData.medications.filter((m) => m !== med),
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={`med-${med}`} className="text-sm font-normal cursor-pointer">
                                {med}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 6. Allergies */}
                  <AccordionItem value="allergies">
                    <AccordionTrigger>6. Allergy Intolerances</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>Known allergies</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {commonAllergies.map((allergy) => (
                              <div key={allergy} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`allergy-${allergy}`}
                                  checked={patientData.allergies.includes(allergy)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setPatientData({
                                        ...patientData,
                                        allergies: [...patientData.allergies, allergy],
                                      });
                                    } else {
                                      setPatientData({
                                        ...patientData,
                                        allergies: patientData.allergies.filter((a) => a !== allergy),
                                      });
                                    }
                                  }}
                                />
                                <Label htmlFor={`allergy-${allergy}`} className="text-sm font-normal cursor-pointer">
                                  {allergy}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 7. Procedures */}
                  <AccordionItem value="procedures">
                    <AccordionTrigger>7. Prior Treatments & Procedures</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        <Label>Prior Treatments</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {treatments.map((treatment) => (
                            <div key={treatment} className="flex items-center space-x-2">
                              <Checkbox
                                id={treatment}
                                checked={patientData.priorTreatments.includes(treatment)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setPatientData({
                                      ...patientData,
                                      priorTreatments: [...patientData.priorTreatments, treatment],
                                    });
                                  } else {
                                    setPatientData({
                                      ...patientData,
                                      priorTreatments: patientData.priorTreatments.filter((t) => t !== treatment),
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={treatment} className="text-sm font-normal cursor-pointer">
                                {treatment}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 8. Immunizations */}
                  <AccordionItem value="immunizations">
                    <AccordionTrigger>8. Immunization History</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        <Label>Received vaccinations</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {commonImmunizations.map((imm) => (
                            <div key={imm} className="flex items-center space-x-2">
                              <Checkbox
                                id={`imm-${imm}`}
                                checked={patientData.immunizations.includes(imm)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setPatientData({
                                      ...patientData,
                                      immunizations: [...patientData.immunizations, imm],
                                    });
                                  } else {
                                    setPatientData({
                                      ...patientData,
                                      immunizations: patientData.immunizations.filter((i) => i !== imm),
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={`imm-${imm}`} className="text-sm font-normal cursor-pointer">
                                {imm}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 9. Family History */}
                  <AccordionItem value="family">
                    <AccordionTrigger>9. Family Medical History</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        <Label>Family history of</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {familyConditions.map((condition) => (
                            <div key={condition} className="flex items-center space-x-2">
                              <Checkbox
                                id={`family-${condition}`}
                                checked={patientData.familyHistory.includes(condition)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setPatientData({
                                      ...patientData,
                                      familyHistory: [...patientData.familyHistory, condition],
                                    });
                                  } else {
                                    setPatientData({
                                      ...patientData,
                                      familyHistory: patientData.familyHistory.filter((f) => f !== condition),
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={`family-${condition}`} className="text-sm font-normal cursor-pointer">
                                {condition}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 10. Encounters */}
                  <AccordionItem value="encounters">
                    <AccordionTrigger>10. Visit & Encounter History</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="encounterType">Recent Encounter Type</Label>
                          <Select value={patientData.encounterType} onValueChange={(value) => setPatientData({ ...patientData, encounterType: value })}>
                            <SelectTrigger id="encounterType">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inpatient">Inpatient</SelectItem>
                              <SelectItem value="ambulatory">Ambulatory</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                              <SelectItem value="virtual">Virtual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastVisit">Last Visit Date</Label>
                          <Input
                            id="lastVisit"
                            type="date"
                            value={patientData.lastVisitDate}
                            onChange={(e) => setPatientData({ ...patientData, lastVisitDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 11. Diagnostic Reports */}
                  <AccordionItem value="diagnostics">
                    <AccordionTrigger>11. Diagnostic Reports & Imaging</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>Recent reports/imaging</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {diagnosticReportTypes.map((report) => (
                              <div key={report} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`diag-${report}`}
                                  checked={patientData.diagnosticReports.includes(report)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setPatientData({
                                        ...patientData,
                                        diagnosticReports: [...patientData.diagnosticReports, report],
                                      });
                                    } else {
                                      setPatientData({
                                        ...patientData,
                                        diagnosticReports: patientData.diagnosticReports.filter((d) => d !== report),
                                      });
                                    }
                                  }}
                                />
                                <Label htmlFor={`diag-${report}`} className="text-sm font-normal cursor-pointer">
                                  {report}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="imagingFindings">Imaging Findings</Label>
                          <Input
                            id="imagingFindings"
                            placeholder="e.g., No metastases detected"
                            value={patientData.imagingFindings}
                            onChange={(e) => setPatientData({ ...patientData, imagingFindings: e.target.value })}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button onClick={handleEligibilityCheck} disabled={isChecking} className="w-full" size="lg">
                  {isChecking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing with AWS Comprehend Medical...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Check Eligibility
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload FHIR JSON</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drop your FHIR patient data file here or click to browse
                  </p>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Eligibility Results</CardTitle>
                <CardDescription>
                  Match analysis for {selectedProtocol?.nctId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-6 border rounded-lg bg-accent/50">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Overall Match Confidence</h3>
                    <p className="text-sm text-muted-foreground">
                      Based on {results.criteria.length} eligibility criteria
                    </p>
                  </div>
                  <Badge className={`${getConfidenceColor(results.overallConfidence)} text-2xl px-6 py-3`}>
                    {results.overallConfidence}%
                  </Badge>
                </div>

                <Accordion type="multiple" className="w-full">
                  {results.criteria.map((criterion: any) => (
                    <AccordionItem key={criterion.id} value={criterion.id}>
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="text-left">{criterion.text}</span>
                          <div className="flex items-center gap-2">
                            <Badge className={getConfidenceColor(criterion.confidence)}>
                              {criterion.confidence}%
                            </Badge>
                            <Badge variant={criterion.met ? 'default' : 'destructive'}>
                              {criterion.met ? 'Met' : 'Not Met'}
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Patient Data:</span> {criterion.patientValue}
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="flex gap-3">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={handleCreateMatch}
                    disabled={isCreatingMatch}
                  >
                    {isCreatingMatch ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Match...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Create Match for Review
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setResults(null);
                      setPatientData({
                        age: '',
                        gender: '',
                        birthDate: '',
                        conditions: [],
                        cancerType: '',
                        stage: '',
                        clinicalStatus: 'active',
                        labValues: {
                          hemoglobin: '',
                          platelets: '',
                          creatinine: '',
                          alt: '',
                          ast: '',
                          wbc: '',
                          neutrophils: '',
                          bilirubin: '',
                        },
                        ecogStatus: '',
                        karnofskyScore: '',
                        medications: [],
                        allergies: [],
                        allergyCriticality: 'low',
                        priorTreatments: [],
                        surgeries: [],
                        immunizations: [],
                        familyHistory: [],
                        encounterType: '',
                        lastVisitDate: '',
                        diagnosticReports: [],
                        imagingFindings: '',
                      });
                    }}
                  >
                    Check Another Patient
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
