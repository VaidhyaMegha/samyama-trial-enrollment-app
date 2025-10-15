import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, Plus, Search, Loader2, UserPlus, Eye, CheckCircle2, X } from 'lucide-react';
import { patientsAPI } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Common options for checkboxes
const commonConditions = ['Diabetes', 'Hypertension', 'Asthma', 'COPD', 'Coronary Artery Disease', 'Heart Failure'];
const commonMedications = ['Aspirin', 'Metformin', 'Atorvastatin', 'Lisinopril', 'Warfarin', 'Prednisone', 'Insulin', 'Levothyroxine'];
const commonAllergies = ['Penicillin', 'Sulfa drugs', 'Aspirin', 'Latex', 'Iodine', 'Peanuts', 'Shellfish', 'Eggs'];
const treatments = ['Chemotherapy', 'Radiation', 'Immunotherapy', 'Targeted Therapy', 'Surgery', 'Hormone Therapy'];
const commonImmunizations = ['COVID-19', 'Influenza', 'Pneumococcal', 'Hepatitis B', 'MMR', 'HPV', 'Shingles', 'Tetanus'];
const familyConditions = ['Cancer', 'Heart Disease', 'Diabetes', 'Hypertension', 'Stroke', "Alzheimer's", 'Kidney Disease', 'Mental Health'];
const diagnosticReportTypes = ['CT Scan', 'MRI', 'PET Scan', 'X-Ray', 'Ultrasound', 'Blood Test', 'Biopsy', 'EKG'];

export default function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [patientDetails, setPatientDetails] = useState<any>(null);

  // Form state for creating patient - All 11 FHIR Resources
  const [newPatient, setNewPatient] = useState({
    // 1. Patient - Demographics
    given_name: '',
    family_name: '',
    gender: 'unknown',
    birth_date: '',

    // 2. Condition - Diagnoses
    conditions: [] as string[],
    cancer_type: '',
    cancer_stage: '',

    // 3. Observation - Lab Values & Performance Status
    lab_values: {
      hemoglobin: '',
      platelets: '',
      creatinine: '',
      alt: '',
      ast: '',
      wbc: '',
      hba1c: '',
      bilirubin: '',
    },
    ecog_status: '',
    karnofsky_score: '',

    // 4. MedicationStatement - Current Medications
    medications: [] as string[],

    // 5. AllergyIntolerance - Allergies
    allergies: [] as string[],

    // 6. Procedure - Prior Treatments/Procedures
    prior_treatments: [] as string[],

    // 7. Immunization - Vaccination History
    immunizations: [] as string[],

    // 8. FamilyMemberHistory - Family History
    family_history: [] as string[],

    // 9. Encounter - Visit History
    encounter_type: '',
    last_visit_date: '',

    // 10. DiagnosticReport - Reports
    diagnostic_reports: [] as string[],
    imaging_findings: '',

    // 11. CarePlan - Active Care Plans
    care_plan_notes: '',
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const response = await patientsAPI.getAll();
      setPatients(response.data || []);
      toast.success(`Loaded ${response.data.length} patients from HealthLake`);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      toast.error(error.message || 'Failed to load patients');
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPatients();
      return;
    }

    setIsLoading(true);
    try {
      const response = await patientsAPI.search({
        name: searchQuery,
        _count: 100
      });
      setPatients(response.data || []);
      toast.success(`Found ${response.data.length} matching patients`);
    } catch (error: any) {
      console.error('Error searching patients:', error);
      toast.error(error.message || 'Failed to search patients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePatient = async () => {
    // Validation
    if (!newPatient.given_name || !newPatient.family_name || !newPatient.birth_date) {
      toast.error('Please fill in required fields: First Name, Last Name, and Birth Date');
      return;
    }

    setIsCreating(true);
    try {
      // Build comprehensive patient data with all 11 FHIR resources
      const patientData: any = {
        // 1. Patient - Demographics
        given_name: newPatient.given_name,
        family_name: newPatient.family_name,
        gender: newPatient.gender,
        birth_date: newPatient.birth_date,
      };

      // 2. Condition - Diagnoses
      if (newPatient.conditions.length > 0 || newPatient.cancer_type || newPatient.cancer_stage) {
        patientData.conditions = newPatient.conditions;
        if (newPatient.cancer_type) patientData.cancer_type = newPatient.cancer_type;
        if (newPatient.cancer_stage) patientData.cancer_stage = newPatient.cancer_stage;
      }

      // 3. Observation - Lab Values & Performance Status
      const hasLabValues = Object.values(newPatient.lab_values).some(v => v !== '');
      if (hasLabValues) {
        patientData.lab_values = newPatient.lab_values;
      }
      if (newPatient.ecog_status) {
        patientData.ecog_status = parseInt(newPatient.ecog_status);
      }
      if (newPatient.karnofsky_score) {
        patientData.karnofsky_score = parseInt(newPatient.karnofsky_score);
      }

      // 4. MedicationStatement
      if (newPatient.medications.length > 0) {
        patientData.medications = newPatient.medications;
      }

      // 5. AllergyIntolerance
      if (newPatient.allergies.length > 0) {
        patientData.allergies = newPatient.allergies;
      }

      // 6. Procedure
      if (newPatient.prior_treatments.length > 0) {
        patientData.prior_treatments = newPatient.prior_treatments;
      }

      // 7. Immunization
      if (newPatient.immunizations.length > 0) {
        patientData.immunizations = newPatient.immunizations;
      }

      // 8. FamilyMemberHistory
      if (newPatient.family_history.length > 0) {
        patientData.family_history = newPatient.family_history;
      }

      // 9. Encounter
      if (newPatient.encounter_type || newPatient.last_visit_date) {
        if (newPatient.encounter_type) patientData.encounter_type = newPatient.encounter_type;
        if (newPatient.last_visit_date) patientData.last_visit_date = newPatient.last_visit_date;
      }

      // 10. DiagnosticReport
      if (newPatient.diagnostic_reports.length > 0 || newPatient.imaging_findings) {
        if (newPatient.diagnostic_reports.length > 0) patientData.diagnostic_reports = newPatient.diagnostic_reports;
        if (newPatient.imaging_findings) patientData.imaging_findings = newPatient.imaging_findings;
      }

      // 11. CarePlan
      if (newPatient.care_plan_notes) {
        patientData.care_plan_notes = newPatient.care_plan_notes;
      }

      const response = await patientsAPI.create(patientData);

      if (response.success) {
        toast.success(`Patient created successfully! ID: ${response.patientId}`);
        toast.success(`Created ${response.createdResources.length} FHIR resources`);

        // Reset form to initial state
        setNewPatient({
          // 1. Patient - Demographics
          given_name: '',
          family_name: '',
          gender: 'unknown',
          birth_date: '',

          // 2. Condition - Diagnoses
          conditions: [],
          cancer_type: '',
          cancer_stage: '',

          // 3. Observation - Lab Values & Performance Status
          lab_values: {
            hemoglobin: '',
            platelets: '',
            creatinine: '',
            alt: '',
            ast: '',
            wbc: '',
            hba1c: '',
            bilirubin: '',
          },
          ecog_status: '',
          karnofsky_score: '',

          // 4. MedicationStatement - Current Medications
          medications: [],

          // 5. AllergyIntolerance - Allergies
          allergies: [],

          // 6. Procedure - Prior Treatments/Procedures
          prior_treatments: [],

          // 7. Immunization - Vaccination History
          immunizations: [],

          // 8. FamilyMemberHistory - Family History
          family_history: [],

          // 9. Encounter - Visit History
          encounter_type: '',
          last_visit_date: '',

          // 10. DiagnosticReport - Reports
          diagnostic_reports: [],
          imaging_findings: '',

          // 11. CarePlan - Active Care Plans
          care_plan_notes: '',
        });

        // Close dialog
        setIsCreateDialogOpen(false);

        // Reload patients
        loadPatients();
      } else {
        toast.error('Failed to create patient');
      }
    } catch (error: any) {
      console.error('Error creating patient:', error);
      toast.error(error.message || 'Failed to create patient');
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewDetails = async (patient: any) => {
    setSelectedPatient(patient);
    setIsViewDetailsOpen(true);
    setIsLoadingDetails(true);

    try {
      // Fetch full patient details with all FHIR resources
      const response = await patientsAPI.getById(patient.id);
      setPatientDetails(response.data);
    } catch (error: any) {
      console.error('Error loading patient details:', error);
      toast.error('Failed to load patient details');
      setPatientDetails(patient); // Fallback to basic data
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCheckEligibility = async (patient: any) => {
    toast.info('Loading complete patient data...');

    try {
      // Fetch full patient details with all FHIR resources from HealthLake
      const response = await patientsAPI.getById(patient.id);
      const fullPatientData = response.data;

      // Navigate to eligibility check page with complete patient data
      navigate('/eligibility-check', {
        state: {
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
          patientId: patient.id,
          patientData: patient
        }
      });
    }
  };

  const filteredPatients = patients.filter(patient =>
    !searchQuery ||
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Patients
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage patients from AWS HealthLake
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create New Patient
              </DialogTitle>
              <DialogDescription>
                Create a comprehensive patient record with all FHIR resources in AWS HealthLake
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Accordion type="multiple" defaultValue={["demographics"]} className="w-full">
                {/* 1. Demographics */}
                <AccordionItem value="demographics">
                  <AccordionTrigger className="text-base font-semibold">
                    1. Patient Demographics *
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="given_name">First Name *</Label>
                        <Input
                          id="given_name"
                          value={newPatient.given_name}
                          onChange={(e) => setNewPatient({ ...newPatient, given_name: e.target.value })}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="family_name">Last Name *</Label>
                        <Input
                          id="family_name"
                          value={newPatient.family_name}
                          onChange={(e) => setNewPatient({ ...newPatient, family_name: e.target.value })}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birth_date">Birth Date *</Label>
                        <Input
                          id="birth_date"
                          type="date"
                          value={newPatient.birth_date}
                          onChange={(e) => setNewPatient({ ...newPatient, birth_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={newPatient.gender} onValueChange={(value) => setNewPatient({ ...newPatient, gender: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. Conditions */}
                <AccordionItem value="conditions">
                  <AccordionTrigger className="text-base font-semibold">
                    2. Conditions / Diagnoses
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cancer_type">Cancer Type (if applicable)</Label>
                        <Input
                          id="cancer_type"
                          value={newPatient.cancer_type}
                          onChange={(e) => setNewPatient({ ...newPatient, cancer_type: e.target.value })}
                          placeholder="e.g., Non-Small Cell Lung Cancer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cancer_stage">Cancer Stage (if applicable)</Label>
                        <Input
                          id="cancer_stage"
                          value={newPatient.cancer_stage}
                          onChange={(e) => setNewPatient({ ...newPatient, cancer_stage: e.target.value })}
                          placeholder="e.g., Stage IIIB"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Common Conditions</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {commonConditions.map((condition) => (
                          <div key={condition} className="flex items-center space-x-2">
                            <Checkbox
                              id={`condition-${condition}`}
                              checked={newPatient.conditions.includes(condition)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewPatient({ ...newPatient, conditions: [...newPatient.conditions, condition] });
                                } else {
                                  setNewPatient({ ...newPatient, conditions: newPatient.conditions.filter(c => c !== condition) });
                                }
                              }}
                            />
                            <label htmlFor={`condition-${condition}`} className="text-sm cursor-pointer">
                              {condition}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. Lab Values & Performance Status */}
                <AccordionItem value="observations">
                  <AccordionTrigger className="text-base font-semibold">
                    3. Lab Values & Performance Status
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hemoglobin">Hemoglobin (g/dL)</Label>
                        <Input
                          id="hemoglobin"
                          type="number"
                          step="0.1"
                          value={newPatient.lab_values.hemoglobin}
                          onChange={(e) => setNewPatient({ ...newPatient, lab_values: { ...newPatient.lab_values, hemoglobin: e.target.value } })}
                          placeholder="e.g., 12.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="platelets">Platelets (x1000/μL)</Label>
                        <Input
                          id="platelets"
                          type="number"
                          value={newPatient.lab_values.platelets}
                          onChange={(e) => setNewPatient({ ...newPatient, lab_values: { ...newPatient.lab_values, platelets: e.target.value } })}
                          placeholder="e.g., 250"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wbc">WBC (x1000/μL)</Label>
                        <Input
                          id="wbc"
                          type="number"
                          step="0.1"
                          value={newPatient.lab_values.wbc}
                          onChange={(e) => setNewPatient({ ...newPatient, lab_values: { ...newPatient.lab_values, wbc: e.target.value } })}
                          placeholder="e.g., 7.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="creatinine">Creatinine (mg/dL)</Label>
                        <Input
                          id="creatinine"
                          type="number"
                          step="0.1"
                          value={newPatient.lab_values.creatinine}
                          onChange={(e) => setNewPatient({ ...newPatient, lab_values: { ...newPatient.lab_values, creatinine: e.target.value } })}
                          placeholder="e.g., 1.0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alt">ALT (U/L)</Label>
                        <Input
                          id="alt"
                          type="number"
                          value={newPatient.lab_values.alt}
                          onChange={(e) => setNewPatient({ ...newPatient, lab_values: { ...newPatient.lab_values, alt: e.target.value } })}
                          placeholder="e.g., 25"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ast">AST (U/L)</Label>
                        <Input
                          id="ast"
                          type="number"
                          value={newPatient.lab_values.ast}
                          onChange={(e) => setNewPatient({ ...newPatient, lab_values: { ...newPatient.lab_values, ast: e.target.value } })}
                          placeholder="e.g., 22"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hba1c">HbA1c (%)</Label>
                        <Input
                          id="hba1c"
                          type="number"
                          step="0.1"
                          value={newPatient.lab_values.hba1c}
                          onChange={(e) => setNewPatient({ ...newPatient, lab_values: { ...newPatient.lab_values, hba1c: e.target.value } })}
                          placeholder="e.g., 5.7"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bilirubin">Bilirubin (mg/dL)</Label>
                        <Input
                          id="bilirubin"
                          type="number"
                          step="0.1"
                          value={newPatient.lab_values.bilirubin}
                          onChange={(e) => setNewPatient({ ...newPatient, lab_values: { ...newPatient.lab_values, bilirubin: e.target.value } })}
                          placeholder="e.g., 0.8"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ecog_status">ECOG Performance Status</Label>
                        <Select value={newPatient.ecog_status} onValueChange={(value) => setNewPatient({ ...newPatient, ecog_status: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ECOG status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0 - Fully active</SelectItem>
                            <SelectItem value="1">1 - Restricted in strenuous activity</SelectItem>
                            <SelectItem value="2">2 - Ambulatory, capable of self-care</SelectItem>
                            <SelectItem value="3">3 - Limited self-care</SelectItem>
                            <SelectItem value="4">4 - Completely disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="karnofsky_score">Karnofsky Score (%)</Label>
                        <Input
                          id="karnofsky_score"
                          type="number"
                          value={newPatient.karnofsky_score}
                          onChange={(e) => setNewPatient({ ...newPatient, karnofsky_score: e.target.value })}
                          placeholder="e.g., 80"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 4. Medications */}
                <AccordionItem value="medications">
                  <AccordionTrigger className="text-base font-semibold">
                    4. Current Medications
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Select Current Medications</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {commonMedications.map((medication) => (
                          <div key={medication} className="flex items-center space-x-2">
                            <Checkbox
                              id={`medication-${medication}`}
                              checked={newPatient.medications.includes(medication)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewPatient({ ...newPatient, medications: [...newPatient.medications, medication] });
                                } else {
                                  setNewPatient({ ...newPatient, medications: newPatient.medications.filter(m => m !== medication) });
                                }
                              }}
                            />
                            <label htmlFor={`medication-${medication}`} className="text-sm cursor-pointer">
                              {medication}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 5. Allergies */}
                <AccordionItem value="allergies">
                  <AccordionTrigger className="text-base font-semibold">
                    5. Allergies & Intolerances
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Select Known Allergies</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {commonAllergies.map((allergy) => (
                          <div key={allergy} className="flex items-center space-x-2">
                            <Checkbox
                              id={`allergy-${allergy}`}
                              checked={newPatient.allergies.includes(allergy)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewPatient({ ...newPatient, allergies: [...newPatient.allergies, allergy] });
                                } else {
                                  setNewPatient({ ...newPatient, allergies: newPatient.allergies.filter(a => a !== allergy) });
                                }
                              }}
                            />
                            <label htmlFor={`allergy-${allergy}`} className="text-sm cursor-pointer">
                              {allergy}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 6. Prior Treatments/Procedures */}
                <AccordionItem value="procedures">
                  <AccordionTrigger className="text-base font-semibold">
                    6. Prior Treatments & Procedures
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Select Prior Treatments</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {treatments.map((treatment) => (
                          <div key={treatment} className="flex items-center space-x-2">
                            <Checkbox
                              id={`treatment-${treatment}`}
                              checked={newPatient.prior_treatments.includes(treatment)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewPatient({ ...newPatient, prior_treatments: [...newPatient.prior_treatments, treatment] });
                                } else {
                                  setNewPatient({ ...newPatient, prior_treatments: newPatient.prior_treatments.filter(t => t !== treatment) });
                                }
                              }}
                            />
                            <label htmlFor={`treatment-${treatment}`} className="text-sm cursor-pointer">
                              {treatment}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 7. Immunizations */}
                <AccordionItem value="immunizations">
                  <AccordionTrigger className="text-base font-semibold">
                    7. Immunization History
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Select Completed Immunizations</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {commonImmunizations.map((immunization) => (
                          <div key={immunization} className="flex items-center space-x-2">
                            <Checkbox
                              id={`immunization-${immunization}`}
                              checked={newPatient.immunizations.includes(immunization)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewPatient({ ...newPatient, immunizations: [...newPatient.immunizations, immunization] });
                                } else {
                                  setNewPatient({ ...newPatient, immunizations: newPatient.immunizations.filter(i => i !== immunization) });
                                }
                              }}
                            />
                            <label htmlFor={`immunization-${immunization}`} className="text-sm cursor-pointer">
                              {immunization}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 8. Family History */}
                <AccordionItem value="family_history">
                  <AccordionTrigger className="text-base font-semibold">
                    8. Family Medical History
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Select Family History Conditions</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {familyConditions.map((condition) => (
                          <div key={condition} className="flex items-center space-x-2">
                            <Checkbox
                              id={`family-${condition}`}
                              checked={newPatient.family_history.includes(condition)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewPatient({ ...newPatient, family_history: [...newPatient.family_history, condition] });
                                } else {
                                  setNewPatient({ ...newPatient, family_history: newPatient.family_history.filter(c => c !== condition) });
                                }
                              }}
                            />
                            <label htmlFor={`family-${condition}`} className="text-sm cursor-pointer">
                              {condition}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 9. Encounter History */}
                <AccordionItem value="encounters">
                  <AccordionTrigger className="text-base font-semibold">
                    9. Encounter / Visit History
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="encounter_type">Last Encounter Type</Label>
                        <Select value={newPatient.encounter_type} onValueChange={(value) => setNewPatient({ ...newPatient, encounter_type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select encounter type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="outpatient">Outpatient Visit</SelectItem>
                            <SelectItem value="inpatient">Inpatient Admission</SelectItem>
                            <SelectItem value="emergency">Emergency Visit</SelectItem>
                            <SelectItem value="telehealth">Telehealth</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_visit_date">Last Visit Date</Label>
                        <Input
                          id="last_visit_date"
                          type="date"
                          value={newPatient.last_visit_date}
                          onChange={(e) => setNewPatient({ ...newPatient, last_visit_date: e.target.value })}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 10. Diagnostic Reports */}
                <AccordionItem value="diagnostic_reports">
                  <AccordionTrigger className="text-base font-semibold">
                    10. Diagnostic Reports & Imaging
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Select Completed Reports/Imaging</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {diagnosticReportTypes.map((report) => (
                          <div key={report} className="flex items-center space-x-2">
                            <Checkbox
                              id={`report-${report}`}
                              checked={newPatient.diagnostic_reports.includes(report)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewPatient({ ...newPatient, diagnostic_reports: [...newPatient.diagnostic_reports, report] });
                                } else {
                                  setNewPatient({ ...newPatient, diagnostic_reports: newPatient.diagnostic_reports.filter(r => r !== report) });
                                }
                              }}
                            />
                            <label htmlFor={`report-${report}`} className="text-sm cursor-pointer">
                              {report}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imaging_findings">Imaging Findings / Notes</Label>
                      <Input
                        id="imaging_findings"
                        value={newPatient.imaging_findings}
                        onChange={(e) => setNewPatient({ ...newPatient, imaging_findings: e.target.value })}
                        placeholder="e.g., No significant findings, mass detected, etc."
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 11. Care Plan */}
                <AccordionItem value="care_plan">
                  <AccordionTrigger className="text-base font-semibold">
                    11. Care Plan & Clinical Notes
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="care_plan_notes">Care Plan Notes</Label>
                      <textarea
                        id="care_plan_notes"
                        className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md text-sm"
                        value={newPatient.care_plan_notes}
                        onChange={(e) => setNewPatient({ ...newPatient, care_plan_notes: e.target.value })}
                        placeholder="Enter care plan details, treatment goals, clinical notes..."
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreatePatient} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Patient
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Patients</CardTitle>
          <CardDescription>
            Search patients by name or ID in AWS HealthLake
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by name or patient ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button variant="outline" onClick={loadPatients} disabled={isLoading}>
              Load All
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No patients found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search query' : 'Create your first patient to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Patient
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
              </p>
            </div>

            <AnimatePresence>
              {filteredPatients.map((patient) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{patient.name}</CardTitle>
                          <CardDescription className="mt-1">
                            Patient ID: {patient.id}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {patient.gender || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Age</p>
                          <p className="text-sm font-semibold">
                            {patient.age ? `${patient.age} years` : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Birth Date</p>
                          <p className="text-sm font-semibold">
                            {patient.birthDate || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Gender</p>
                          <p className="text-sm font-semibold capitalize">
                            {patient.gender || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(patient)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleCheckEligibility(patient)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Check Eligibility
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* View Patient Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Patient Details
            </DialogTitle>
            <DialogDescription>
              Complete patient information from AWS HealthLake
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : patientDetails ? (
            <div className="space-y-6 py-4">
              {/* Basic Demographics */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Demographics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                    <p className="text-sm font-semibold">{patientDetails.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
                    <p className="text-sm font-semibold font-mono">{patientDetails.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gender</p>
                    <p className="text-sm font-semibold capitalize">{patientDetails.gender || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Birth Date</p>
                    <p className="text-sm font-semibold">{patientDetails.birthDate || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Age</p>
                    <p className="text-sm font-semibold">{patientDetails.age ? `${patientDetails.age} years` : 'Unknown'}</p>
                  </div>
                  {patientDetails.identifier && patientDetails.identifier.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Identifiers</p>
                      <p className="text-sm font-semibold">{patientDetails.identifier.length} identifier(s)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* FHIR Resources Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">FHIR Resources</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {patientDetails.conditions && (
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Conditions</p>
                      <p className="text-lg font-bold">{patientDetails.conditions.length || 0}</p>
                    </Card>
                  )}
                  {patientDetails.observations && (
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Observations</p>
                      <p className="text-lg font-bold">{patientDetails.observations.length || 0}</p>
                    </Card>
                  )}
                  {patientDetails.medications && (
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Medications</p>
                      <p className="text-lg font-bold">{patientDetails.medications.length || 0}</p>
                    </Card>
                  )}
                  {patientDetails.allergies && (
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Allergies</p>
                      <p className="text-lg font-bold">{patientDetails.allergies.length || 0}</p>
                    </Card>
                  )}
                  {patientDetails.procedures && (
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Procedures</p>
                      <p className="text-lg font-bold">{patientDetails.procedures.length || 0}</p>
                    </Card>
                  )}
                  {patientDetails.immunizations && (
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Immunizations</p>
                      <p className="text-lg font-bold">{patientDetails.immunizations.length || 0}</p>
                    </Card>
                  )}
                  {patientDetails.diagnosticReports && (
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Reports</p>
                      <p className="text-lg font-bold">{patientDetails.diagnosticReports.length || 0}</p>
                    </Card>
                  )}
                  {patientDetails.encounters && (
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Encounters</p>
                      <p className="text-lg font-bold">{patientDetails.encounters.length || 0}</p>
                    </Card>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setIsViewDetailsOpen(false);
                    handleCheckEligibility(patientDetails);
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Check Eligibility for Trials
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsViewDetailsOpen(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No details available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
