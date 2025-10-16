import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Activity, Pill, AlertCircle, Syringe, Heart, FileText, Stethoscope, CalendarDays, Microscope, ClipboardList } from 'lucide-react';

interface PatientProfileCardProps {
  patientData: any;
}

export default function PatientProfileCard({ patientData }: PatientProfileCardProps) {
  // Calculate age from birth date if available
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = patientData.age || calculateAge(patientData.birthDate);

  return (
    <div className="space-y-4">
      {/* Header - Patient Demographics */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{patientData.name || 'Patient Profile'}</CardTitle>
                <CardDescription className="mt-1">
                  Patient ID: <span className="font-mono font-semibold">{patientData.id}</span>
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-base px-4 py-1">
              {patientData.gender ? patientData.gender.charAt(0).toUpperCase() + patientData.gender.slice(1) : 'Unknown'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Age</p>
              <p className="text-2xl font-bold">{age ? `${age} years` : 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Birth Date</p>
              <p className="text-lg font-semibold">{patientData.birthDate || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Gender</p>
              <p className="text-lg font-semibold capitalize">{patientData.gender || 'Unknown'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions Section */}
      {patientData.conditions && patientData.conditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Conditions & Diagnoses
              <Badge variant="secondary">{patientData.conditions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patientData.conditions.map((condition: any, index: number) => {
                const conditionText = typeof condition === 'string'
                  ? condition
                  : condition.code?.text || condition.code?.coding?.[0]?.display || 'Unknown condition';
                return (
                  <Badge key={index} variant="outline" className="px-3 py-1 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                    {conditionText}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lab Values Section */}
      {patientData.observations && patientData.observations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-blue-500" />
              Lab Values & Observations
              <Badge variant="secondary">{patientData.observations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {patientData.observations.map((obs: any, index: number) => {
                const code = obs.code?.coding?.[0]?.code;
                const display = obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown';
                const value = obs.valueQuantity?.value || obs.valueInteger || 'N/A';
                const unit = obs.valueQuantity?.unit || '';

                // Map common LOINC codes to readable names
                let label = display;
                if (code === '718-7') label = 'Hemoglobin';
                else if (code === '777-3') label = 'Platelets';
                else if (code === '2160-0') label = 'Creatinine';
                else if (code === '1742-6') label = 'ALT';
                else if (code === '1920-8') label = 'AST';
                else if (code === '6690-2') label = 'WBC';
                else if (code === '1988-5') label = 'Neutrophils';
                else if (code === '1975-2') label = 'Bilirubin';
                else if (code === '4548-4') label = 'HbA1c';
                else if (code === '89247-1') label = 'ECOG Status';

                return (
                  <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      {value} {unit}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medications Section */}
      {patientData.medicationstatements && patientData.medicationstatements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-green-500" />
              Current Medications
              <Badge variant="secondary">{patientData.medicationstatements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patientData.medicationstatements.map((med: any, index: number) => {
                const medName = med.medicationCodeableConcept?.text || med.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown medication';
                return (
                  <Badge key={index} variant="outline" className="px-3 py-1 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    {medName}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allergies Section */}
      {patientData.allergyintolerances && patientData.allergyintolerances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Allergies & Intolerances
              <Badge variant="secondary">{patientData.allergyintolerances.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patientData.allergyintolerances.map((allergy: any, index: number) => {
                const allergyName = allergy.code?.text || allergy.code?.coding?.[0]?.display || 'Unknown allergy';
                return (
                  <Badge key={index} variant="outline" className="px-3 py-1 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                    {allergyName}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Procedures Section */}
      {patientData.procedures && patientData.procedures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-purple-500" />
              Prior Treatments & Procedures
              <Badge variant="secondary">{patientData.procedures.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patientData.procedures.map((proc: any, index: number) => {
                const procName = proc.code?.text || proc.code?.coding?.[0]?.display || 'Unknown procedure';
                return (
                  <Badge key={index} variant="outline" className="px-3 py-1 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                    {procName}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Immunizations Section */}
      {patientData.immunizations && patientData.immunizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-cyan-500" />
              Immunization History
              <Badge variant="secondary">{patientData.immunizations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patientData.immunizations.map((imm: any, index: number) => {
                const vaccineName = imm.vaccineCode?.text || imm.vaccineCode?.coding?.[0]?.display || 'Unknown vaccine';
                return (
                  <Badge key={index} variant="outline" className="px-3 py-1 bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800">
                    {vaccineName}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Family History Section */}
      {patientData.familyHistory && patientData.familyHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Family Medical History
              <Badge variant="secondary">{patientData.familyHistory.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patientData.familyHistory.map((fh: any, index: number) => {
                const conditions = fh.condition?.map((c: any) =>
                  c.code?.text || c.code?.coding?.[0]?.display
                ).filter(Boolean) || [];

                return (
                  <div key={index} className="p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-800">
                    <p className="text-sm font-medium">
                      {fh.relationship?.coding?.[0]?.display || 'Family Member'}
                    </p>
                    {conditions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {conditions.map((condition: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Encounters Section */}
      {patientData.encounters && patientData.encounters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-500" />
              Recent Encounters
              <Badge variant="secondary">{patientData.encounters.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patientData.encounters.slice(0, 3).map((encounter: any, index: number) => (
                <div key={index} className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {encounter.class?.display || 'Unknown Type'}
                    </p>
                    {encounter.period?.start && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(encounter.period.start).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostic Reports Section */}
      {patientData.diagnosticreports && patientData.diagnosticreports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              Diagnostic Reports
              <Badge variant="secondary">{patientData.diagnosticreports.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patientData.diagnosticreports.map((report: any, index: number) => {
                const reportName = report.code?.text || report.code?.coding?.[0]?.display || 'Unknown report';
                return (
                  <Badge key={index} variant="outline" className="px-3 py-1 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    {reportName}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Care Plans Section */}
      {patientData.careplans && patientData.careplans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-teal-500" />
              Active Care Plans
              <Badge variant="secondary">{patientData.careplans.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patientData.careplans.map((plan: any, index: number) => (
                <div key={index} className="p-3 bg-teal-50 dark:bg-teal-950/20 rounded-lg border border-teal-200 dark:border-teal-800">
                  <p className="text-sm font-medium">
                    {plan.title || plan.description || 'Care Plan'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {plan.status || 'active'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
