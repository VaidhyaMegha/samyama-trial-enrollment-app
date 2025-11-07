import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Upload, Loader2, CheckCircle2, Users, FileDown, TrendingUp, AlertCircle, CheckCircle, XCircle, Activity } from 'lucide-react';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PatientProfileCard from '@/components/PatientProfileCard';

export default function EligibilityCheck() {
  const location = useLocation();
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

  // Load patients when protocol is selected
  useEffect(() => {
    const loadPatients = async () => {
      if (selectedProtocol && patients.length === 0) {
        setIsLoadingPatients(true);
        try {
          const response = await patientsAPI.getAll();
          setPatients(response.data || []);
        } catch (error: any) {
          console.error('Error loading patients:', error);
          toast.error('Failed to load patients');
        } finally {
          setIsLoadingPatients(false);
        }
      }
    };
    loadPatients();
  }, [selectedProtocol]);

  // Check for patient data and protocol from navigation state
  useEffect(() => {
    const state = location.state as any;

    // If protocol data is passed (from Protocols page Flow 2), pre-select it
    if (state?.protocolData) {
      setSelectedProtocol(state.protocolData);
      toast.success(`Protocol ${state.protocolData.nctId} pre-selected`);
    }

    // Handle full patient data from HealthLake
    if (state?.fullPatientData) {
      const fullPatient = state.fullPatientData;
      console.log('Full patient data received:', fullPatient);
      setSelectedPatient(fullPatient);

      // Pre-populate ALL patient data fields from FHIR resources
      const newPatientData: any = {
        // Demographics
        age: fullPatient.age?.toString() || '',
        gender: fullPatient.gender ? fullPatient.gender.charAt(0).toUpperCase() + fullPatient.gender.slice(1).toLowerCase() : '',

        // Conditions
        conditions: [],
        cancerType: '',
        stage: '',
        clinicalStatus: 'active',

        // Lab Values
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

        // Performance Status
        ecogStatus: '',
        karnofskyScore: '',

        // Medications
        medications: [],

        // Allergies
        allergies: [],
        allergyCriticality: 'low',

        // Procedures
        priorTreatments: [],
        surgeries: [],

        // Immunizations
        immunizations: [],

        // Family History
        familyHistory: [],

        // Encounters
        encounterType: '',
        lastVisitDate: '',

        // Diagnostic Reports
        diagnosticReports: [],
        imagingFindings: '',
      };

      // Extract Conditions
      if (fullPatient.conditions && Array.isArray(fullPatient.conditions)) {
        fullPatient.conditions.forEach((cond: any) => {
          const conditionText = cond.code?.text || cond.code?.coding?.[0]?.display || '';
          if (conditionText) {
            newPatientData.conditions.push(conditionText);
          }
        });
      }

      // Extract Observations (Lab values & Performance Status)
      if (fullPatient.observations && Array.isArray(fullPatient.observations)) {
        fullPatient.observations.forEach((obs: any) => {
          const code = obs.code?.coding?.[0]?.code;
          const value = obs.valueQuantity?.value || obs.valueInteger;

          // Lab values mapping by LOINC code
          if (code === '718-7') newPatientData.labValues.hemoglobin = value?.toString() || '';
          else if (code === '777-3') newPatientData.labValues.platelets = value?.toString() || '';
          else if (code === '2160-0') newPatientData.labValues.creatinine = value?.toString() || '';
          else if (code === '1742-6') newPatientData.labValues.alt = value?.toString() || '';
          else if (code === '1920-8') newPatientData.labValues.ast = value?.toString() || '';
          else if (code === '6690-2') newPatientData.labValues.wbc = value?.toString() || '';
          else if (code === '1988-5') newPatientData.labValues.neutrophils = value?.toString() || '';
          else if (code === '1975-2') newPatientData.labValues.bilirubin = value?.toString() || '';
          else if (code === '4548-4') newPatientData.labValues.hba1c = value?.toString() || '';
          // Performance Status
          else if (code === '89247-1') newPatientData.ecogStatus = value?.toString() || '';
          else if (obs.code?.text?.toLowerCase().includes('karnofsky')) {
            newPatientData.karnofskyScore = value?.toString() || '';
          }
        });
      }

      // Extract Medications (note the key is 'medicationstatements' not 'medications')
      if (fullPatient.medicationstatements && Array.isArray(fullPatient.medicationstatements)) {
        fullPatient.medicationstatements.forEach((med: any) => {
          const medName = med.medicationCodeableConcept?.text || med.medicationCodeableConcept?.coding?.[0]?.display;
          if (medName) {
            newPatientData.medications.push(medName);
          }
        });
      }

      // Extract Allergies (note the key is 'allergyintolerances' not 'allergies')
      if (fullPatient.allergyintolerances && Array.isArray(fullPatient.allergyintolerances)) {
        fullPatient.allergyintolerances.forEach((allergy: any) => {
          const allergyName = allergy.code?.text || allergy.code?.coding?.[0]?.display;
          if (allergyName) {
            newPatientData.allergies.push(allergyName);
          }
        });
      }

      // Extract Procedures (Prior Treatments)
      if (fullPatient.procedures && Array.isArray(fullPatient.procedures)) {
        fullPatient.procedures.forEach((proc: any) => {
          const procName = proc.code?.text || proc.code?.coding?.[0]?.display;
          if (procName) {
            newPatientData.priorTreatments.push(procName);
          }
        });
      }

      // Extract Immunizations
      if (fullPatient.immunizations && Array.isArray(fullPatient.immunizations)) {
        fullPatient.immunizations.forEach((imm: any) => {
          const vaccineName = imm.vaccineCode?.text || imm.vaccineCode?.coding?.[0]?.display;
          if (vaccineName) {
            newPatientData.immunizations.push(vaccineName);
          }
        });
      }

      // Extract Family History
      if (fullPatient.familyHistory && Array.isArray(fullPatient.familyHistory)) {
        fullPatient.familyHistory.forEach((fh: any) => {
          // Family history can have condition array
          if (fh.condition && Array.isArray(fh.condition)) {
            fh.condition.forEach((c: any) => {
              const conditionText = c.code?.text || c.code?.coding?.[0]?.display;
              if (conditionText) {
                newPatientData.familyHistory.push(conditionText);
              }
            });
          }
        });
      }

      // Extract Encounters
      if (fullPatient.encounters && Array.isArray(fullPatient.encounters) && fullPatient.encounters.length > 0) {
        const lastEncounter = fullPatient.encounters[0];
        // Map encounter class display to our form values
        const encounterType = lastEncounter.class?.display?.toLowerCase();
        if (encounterType) {
          // Map FHIR values to form values
          if (encounterType.includes('ambulatory')) newPatientData.encounterType = 'ambulatory';
          else if (encounterType.includes('inpatient')) newPatientData.encounterType = 'inpatient';
          else if (encounterType.includes('emergency')) newPatientData.encounterType = 'emergency';
          else if (encounterType.includes('virtual')) newPatientData.encounterType = 'virtual';
        }
        // Extract start date from period
        if (lastEncounter.period?.start) {
          // Convert ISO datetime to date only (YYYY-MM-DD)
          const dateOnly = lastEncounter.period.start.split('T')[0];
          newPatientData.lastVisitDate = dateOnly;
        }
      }

      // Extract Diagnostic Reports (note the key is 'diagnosticreports')
      if (fullPatient.diagnosticreports && Array.isArray(fullPatient.diagnosticreports)) {
        fullPatient.diagnosticreports.forEach((report: any) => {
          const reportName = report.code?.text || report.code?.coding?.[0]?.display;
          if (reportName) {
            newPatientData.diagnosticReports.push(reportName);
          }
        });
      }

      setPatientData(newPatientData);
      toast.success(`Patient ${fullPatient.name} data loaded with all FHIR resources`);
    }
    // Fallback for basic patient data
    else if (state?.patientData) {
      const patient = state.patientData;
      setSelectedPatient(patient);

      setPatientData({
        ...patientData,
        age: patient.age?.toString() || '',
        gender: patient.gender || '',
      });

      toast.success(`Patient ${patient.name} loaded`);
    }
  }, [location]);

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

    // For existing patients with ID, we don't need to validate form fields
    // as we're using their full FHIR data directly
    if (!selectedPatient?.id) {
      // Only validate for temporary/manual patients
      if (!patientData.age || !patientData.gender || !patientData.ecogStatus) {
        toast.error('Please fill in required patient information');
        return;
      }
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

  const handleExportPDF = async () => {
    if (!results || !selectedProtocol) {
      toast.error('No results to export');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Load Samyama.ai Logo asynchronously
      const logoImg = new Image();
      logoImg.src = '/branding/samyama_light_bg.png';

      // Wait for logo to load
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => {
          try {
            // Add logo at top-left (40x10mm)
            doc.addImage(logoImg, 'PNG', 14, 8, 40, 10);
            resolve();
          } catch (error) {
            console.warn('Failed to add logo to PDF:', error);
            resolve(); // Continue even if logo fails
          }
        };
        logoImg.onerror = () => {
          console.warn('Logo image failed to load');
          resolve(); // Continue without logo if it fails to load
        };
        // Timeout after 3 seconds
        setTimeout(() => resolve(), 3000);
      });

      // Header with Company Branding
      doc.setFontSize(20);
      doc.setTextColor(31, 41, 55); // gray-800
      doc.text('Eligibility Assessment Report', pageWidth / 2, 25, { align: 'center' });

      // Company Name
      doc.setFontSize(10);
      doc.setTextColor(99, 102, 241); // primary color
      doc.text('Powered by Samyama.ai', pageWidth / 2, 32, { align: 'center' });

      // Date
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 38, { align: 'center' });

      // Protocol Information
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('Protocol Information', 14, 48);

      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text(`Protocol ID: ${selectedProtocol.nctId}`, 14, 56);
      doc.text(`Title: ${selectedProtocol.title}`, 14, 62);
      doc.text(`Phase: ${selectedProtocol.phase}`, 14, 68);
      doc.text(`Disease: ${selectedProtocol.disease}`, 14, 74);

      // Patient Information
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('Patient Information', 14, 86);

      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text(`Age: ${patientData.age} years`, 14, 94);
      doc.text(`Gender: ${patientData.gender}`, 14, 100);
      doc.text(`ECOG Status: ${patientData.ecogStatus}`, 14, 106);

      // Overall Score
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('Overall Match Score', 14, 118);

      doc.setFontSize(24);
      const scoreColor = results.overallConfidence >= 80 ? [34, 197, 94] :
                        results.overallConfidence >= 50 ? [251, 191, 36] :
                        [239, 68, 68];
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.text(`${results.overallConfidence}%`, 14, 130);

      // Criteria Summary
      const metCount = results.criteria.filter((c: any) => c.met).length;
      const totalCount = results.criteria.length;

      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text(`Criteria Met: ${metCount} / ${totalCount}`, 14, 138);

      // Criteria Details Table
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('Detailed Criteria Analysis', 14, 150);

      const tableData = results.criteria.map((criterion: any) => [
        criterion.text.substring(0, 60) + (criterion.text.length > 60 ? '...' : ''),
        criterion.met ? 'Met' : 'Not Met',
        `${criterion.confidence}%`,
        criterion.patientValue?.substring(0, 40) + (criterion.patientValue?.length > 40 ? '...' : '') || 'N/A'
      ]);

      autoTable(doc, {
        head: [['Criterion', 'Status', 'Confidence', 'Patient Value']],
        body: tableData,
        startY: 156,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8, textColor: [55, 65, 81] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 28, halign: 'center' },
          3: { cellWidth: 65 }
        },
        didDrawCell: (data) => {
          // Color-code the status column
          if (data.column.index === 1 && data.section === 'body') {
            const status = data.cell.raw as string;
            if (status === 'Met') {
              doc.setTextColor(34, 197, 94); // green
            } else {
              doc.setTextColor(239, 68, 68); // red
            }
          }
        }
      });

      // Footer with Samyama.ai branding
      const finalY = (doc as any).lastAutoTable.finalY || 200;
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('Trial Compass Pro - Clinical Trial Eligibility Assessment', pageWidth / 2, finalY + 15, { align: 'center' });
      doc.text('This report is for informational purposes only and does not constitute medical advice.', pageWidth / 2, finalY + 20, { align: 'center' });

      // Samyama.ai branding in footer
      doc.setFontSize(9);
      doc.setTextColor(99, 102, 241); // primary color
      doc.text('Powered by Samyama.ai | https://samyama.ai', pageWidth / 2, finalY + 28, { align: 'center' });

      // Save PDF
      const fileName = `eligibility-report-${selectedProtocol.nctId}-${new Date().getTime()}.pdf`;
      doc.save(fileName);

      toast.success('PDF report exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
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
          Search for a protocol and assess patient eligibility for screening
        </p>
      </div>

      {/* Regulatory Compliance Notice */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-amber-600 mt-0.5">⚠️</div>
            <div className="space-y-1">
              <p className="font-semibold text-amber-900">Important: Screening vs. Enrollment</p>
              <p className="text-sm text-amber-800">
                This tool provides preliminary eligibility assessment for <strong>screening purposes only</strong>. 
                Approval here means the patient can proceed to a screening visit, NOT direct enrollment. 
                Final eligibility must be confirmed during the screening visit per protocol requirements and ICH-GCP guidelines.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Patient Selection OR Data Entry OR Profile Display */}
      {selectedProtocol && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>
              {selectedPatient && selectedPatient.id
                ? 'Review patient profile before checking eligibility'
                : 'Select an existing patient or enter temporary patient data for eligibility assessment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Patient Selector - Show when no patient is selected yet */}
            {!selectedPatient?.id && (
              <div className="space-y-2 p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Select Existing Patient (Optional)
                </label>
                <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="text-muted-foreground">
                        {isLoadingPatients ? 'Loading patients...' : 'Search and select an existing patient...'}
                      </span>
                      <Search className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search by patient name or ID..."
                        value={patientSearch}
                        onValueChange={(value) => setPatientSearch(value)}
                      />
                      <CommandList>
                        {isLoadingPatients && (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                            Loading patients...
                          </div>
                        )}
                        {!isLoadingPatients && patients.length === 0 && (
                          <CommandEmpty>No patients found. You can enter patient data manually below.</CommandEmpty>
                        )}
                        {!isLoadingPatients && patients.length > 0 && (
                          <CommandGroup heading={`${patients.filter((p: any) =>
                            !patientSearch ||
                            p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                            p.id.toLowerCase().includes(patientSearch.toLowerCase())
                          ).length} patient(s) found`}>
                            {patients
                              .filter((p: any) =>
                                !patientSearch ||
                                p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                                p.id.toLowerCase().includes(patientSearch.toLowerCase())
                              )
                              .map((patient: any) => (
                                <CommandItem
                                  key={patient.id}
                                  onSelect={async () => {
                                    setPatientPopoverOpen(false);
                                    toast.info('Loading complete patient data...');

                                    try {
                                      // Fetch full patient details
                                      const response = await patientsAPI.getById(patient.id);
                                      const fullPatientData = response.data;
                                      setSelectedPatient(fullPatientData);

                                      // Extract and populate patientData
                                      const newPatientData: any = {
                                        age: fullPatientData.age?.toString() || '',
                                        gender: fullPatientData.gender ? fullPatientData.gender.charAt(0).toUpperCase() + fullPatientData.gender.slice(1).toLowerCase() : '',
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
                                      };

                                      // Extract data from FHIR resources (same logic as useEffect)
                                      if (fullPatientData.conditions && Array.isArray(fullPatientData.conditions)) {
                                        fullPatientData.conditions.forEach((cond: any) => {
                                          const conditionText = cond.code?.text || cond.code?.coding?.[0]?.display || '';
                                          if (conditionText) {
                                            newPatientData.conditions.push(conditionText);
                                          }
                                        });
                                      }

                                      if (fullPatientData.observations && Array.isArray(fullPatientData.observations)) {
                                        fullPatientData.observations.forEach((obs: any) => {
                                          const code = obs.code?.coding?.[0]?.code;
                                          const value = obs.valueQuantity?.value || obs.valueInteger;
                                          if (code === '718-7') newPatientData.labValues.hemoglobin = value?.toString() || '';
                                          else if (code === '777-3') newPatientData.labValues.platelets = value?.toString() || '';
                                          else if (code === '2160-0') newPatientData.labValues.creatinine = value?.toString() || '';
                                          else if (code === '1742-6') newPatientData.labValues.alt = value?.toString() || '';
                                          else if (code === '1920-8') newPatientData.labValues.ast = value?.toString() || '';
                                          else if (code === '6690-2') newPatientData.labValues.wbc = value?.toString() || '';
                                          else if (code === '1988-5') newPatientData.labValues.neutrophils = value?.toString() || '';
                                          else if (code === '1975-2') newPatientData.labValues.bilirubin = value?.toString() || '';
                                          else if (code === '89247-1') newPatientData.ecogStatus = value?.toString() || '';
                                        });
                                      }

                                      setPatientData(newPatientData);
                                      toast.success(`Patient ${fullPatientData.name} loaded successfully`);
                                    } catch (error: any) {
                                      console.error('Error loading patient:', error);
                                      toast.error('Failed to load patient data');
                                      setSelectedPatient(patient);
                                    }
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
                  Or enter patient data manually below
                </p>
              </div>
            )}

            {/* If we have an existing patient with ID, show profile card instead of form */}
            {selectedPatient && selectedPatient.id ? (
              <div className="space-y-4">
                <PatientProfileCard patientData={selectedPatient} />

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
              </div>
            ) : (
              // Original form for temporary/manual patient entry
              <Tabs defaultValue="manual">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="upload">Upload FHIR JSON</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4 mt-4">
                {/* 1. Patient Demographics */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">1. Patient Demographics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Results - Modern Professional UI */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header Card with Score */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Activity className="h-6 w-6 text-primary" />
                      Eligibility Assessment Results
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Protocol: <span className="font-semibold text-foreground">{selectedProtocol?.nctId}</span> - {selectedProtocol?.title}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="px-4 py-2 text-sm">
                    {new Date().toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Overall Score Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Score Circle */}
                  <div className="flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="relative w-40 h-40"
                    >
                      <svg className="w-40 h-40 transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-muted"
                        />
                        <motion.circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeLinecap="round"
                          className={
                            results.overallConfidence >= 80 ? "text-green-500" :
                            results.overallConfidence >= 50 ? "text-yellow-500" :
                            "text-red-500"
                          }
                          initial={{ strokeDasharray: "439.8", strokeDashoffset: "439.8" }}
                          animate={{ strokeDashoffset: 439.8 - (439.8 * results.overallConfidence / 100) }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold ${
                          results.overallConfidence >= 80 ? "text-green-600" :
                          results.overallConfidence >= 50 ? "text-yellow-600" :
                          "text-red-600"
                        }`}>
                          {results.overallConfidence}%
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">Match Score</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Statistics */}
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">Criteria Met</span>
                      </div>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                        {results.criteria.filter((c: any) => c.met).length}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                        Eligible for {Math.round((results.criteria.filter((c: any) => c.met).length / results.criteria.length) * 100)}% of criteria
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-900 dark:text-red-100">Not Met</span>
                      </div>
                      <p className="text-3xl font-bold text-red-700 dark:text-red-400">
                        {results.criteria.filter((c: any) => !c.met).length}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                        Requires attention or waiver
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Criteria</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                        {results.criteria.length}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                        Evaluated criteria
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Recommendation</span>
                      </div>
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                        {results.overallConfidence >= 80 ? "Highly Eligible" :
                         results.overallConfidence >= 50 ? "Potentially Eligible" :
                         "Review Required"}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                        Based on analysis
                      </p>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Criteria Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Detailed Criteria Analysis
                </CardTitle>
                <CardDescription>
                  Individual criterion evaluation with confidence scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.criteria.map((criterion: any, index: number) => (
                    <motion.div
                      key={criterion.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                        criterion.met
                          ? 'bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-900'
                          : 'bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {criterion.met ? (
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                            )}
                            <p className="font-medium text-sm">{criterion.text}</p>
                          </div>
                          <div className="ml-7 space-y-1">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-semibold">Patient Value:</span> {criterion.patientValue || 'Not provided'}
                            </p>
                            {criterion.reasoning && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-semibold">Reasoning:</span> {criterion.reasoning}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={criterion.met ? "default" : "destructive"}
                            className="font-semibold"
                          >
                            {criterion.met ? "Met" : "Not Met"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${
                              criterion.confidence >= 80 ? "border-green-500 text-green-700" :
                              criterion.confidence >= 50 ? "border-yellow-500 text-yellow-700" :
                              "border-red-500 text-red-700"
                            }`}
                          >
                            {criterion.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={handleCreateMatch}
                    disabled={isCreatingMatch}
                    className="w-full"
                  >
                    {isCreatingMatch ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Match...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Create Match for Review
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleExportPDF}
                    className="w-full"
                  >
                    <FileDown className="mr-2 h-5 w-5" />
                    Export PDF Report
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setResults(null);
                      setPatientData({
                        age: '',
                        gender: '',
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
                    className="w-full"
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
