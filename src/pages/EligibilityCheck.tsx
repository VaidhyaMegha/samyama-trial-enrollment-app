import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, Loader2, CheckCircle2 } from 'lucide-react';
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
import { protocolsAPI, eligibilityAPI } from '@/services/api';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export default function EligibilityCheck() {
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [protocolSearch, setProtocolSearch] = useState('');
  const [protocols, setProtocols] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [open, setOpen] = useState(false);

  // Patient data
  const [patientData, setPatientData] = useState({
    age: '',
    gender: '',
    ecogStatus: '',
    cancerType: '',
    stage: '',
    priorTreatments: [] as string[],
    labValues: {
      hemoglobin: '',
      platelets: '',
      creatinine: '',
      alt: '',
      ast: '',
    },
  });

  const handleProtocolSearch = async (value: string) => {
    setProtocolSearch(value);
    if (value.length > 2) {
      setIsSearching(true);
      try {
        const response: any = await protocolsAPI.search(value);
        setProtocols(response.data);
      } catch (error) {
        toast.error('Failed to search protocols');
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
    } catch (error) {
      toast.error('Failed to check eligibility');
    } finally {
      setIsChecking(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-success text-success-foreground';
    if (confidence >= 50) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const treatments = ['Chemotherapy', 'Radiation', 'Immunotherapy', 'Targeted Therapy', 'Surgery'];

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
                  {isSearching && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  )}
                  {!isSearching && protocols.length === 0 && protocolSearch.length > 2 && (
                    <CommandEmpty>No protocols found.</CommandEmpty>
                  )}
                  {!isSearching && protocols.length > 0 && (
                    <CommandGroup>
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
                            </div>
                            <span className="text-sm text-muted-foreground">{protocol.title}</span>
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
                    <Label htmlFor="ecog">ECOG Status *</Label>
                    <Select value={patientData.ecogStatus} onValueChange={(value) => setPatientData({ ...patientData, ecogStatus: value })}>
                      <SelectTrigger id="ecog">
                        <SelectValue placeholder="Select ECOG" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((status) => (
                          <SelectItem key={status} value={status.toString()}>
                            ECOG {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="labs">
                    <AccordionTrigger>Lab Values</AccordionTrigger>
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
                  <Button variant="outline" className="flex-1">
                    Export PDF Report
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setResults(null);
                      setPatientData({
                        age: '',
                        gender: '',
                        ecogStatus: '',
                        cancerType: '',
                        stage: '',
                        priorTreatments: [],
                        labValues: {
                          hemoglobin: '',
                          platelets: '',
                          creatinine: '',
                          alt: '',
                          ast: '',
                        },
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
