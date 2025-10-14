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

  // Form state for creating patient
  const [newPatient, setNewPatient] = useState({
    given_name: '',
    family_name: '',
    gender: 'unknown',
    birth_date: '',
    ecog_status: '',
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
      const patientData: any = {
        given_name: newPatient.given_name,
        family_name: newPatient.family_name,
        gender: newPatient.gender,
        birth_date: newPatient.birth_date,
      };

      // Add ECOG status if provided
      if (newPatient.ecog_status) {
        patientData.ecog_status = parseInt(newPatient.ecog_status);
      }

      const response = await patientsAPI.create(patientData);

      if (response.success) {
        toast.success(`Patient created successfully! ID: ${response.patientId}`);
        toast.success(`Created ${response.createdResources.length} FHIR resources`);

        // Reset form
        setNewPatient({
          given_name: '',
          family_name: '',
          gender: 'unknown',
          birth_date: '',
          ecog_status: '',
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

  const handleCheckEligibility = (patient: any) => {
    // Navigate to eligibility check page with patient data pre-filled
    navigate('/eligibility-check', {
      state: {
        patientId: patient.id,
        patientData: patient
      }
    });
    toast.info('Redirecting to Eligibility Check...');
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create New Patient
              </DialogTitle>
              <DialogDescription>
                Create a new patient record in AWS HealthLake. This will create the patient with basic demographics.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
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

              <div className="space-y-2">
                <Label htmlFor="ecog_status">ECOG Performance Status (Optional)</Label>
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Note: This creates a basic patient record. You can add more FHIR resources (conditions, medications, allergies, etc.) after creation using the full patient management interface.
                </p>
              </div>
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
