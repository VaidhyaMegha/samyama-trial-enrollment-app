import { useState, useCallback } from 'react';
import { Upload, FileText, Download, Trash2, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { protocolsAPI } from '@/services/api';
import { Progress } from '@/components/ui/progress';

export default function Protocols() {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response: any = await protocolsAPI.upload(file);
      setUploadProgress(100);
      toast.success('Protocol uploaded successfully');
      
      // Refresh protocols list
      const protocolsResponse: any = await protocolsAPI.getAll();
      setProtocols(protocolsResponse.data);
    } catch (error) {
      toast.error('Failed to upload protocol');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const loadProtocols = async () => {
    try {
      const response: any = await protocolsAPI.getAll();
      setProtocols(response.data);
    } catch (error) {
      toast.error('Failed to load protocols');
    }
  };

  useState(() => {
    loadProtocols();
  });

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

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Protocol</CardTitle>
          <CardDescription>
            Upload PDF protocol documents for processing with AWS Textract and Comprehend Medical
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
            {!isUploading && (
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            )}
          </div>

          {isUploading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {uploadProgress < 30 && 'Extracting text (Textract)...'}
                  {uploadProgress >= 30 && uploadProgress < 60 && 'Analyzing criteria (Comprehend Medical)...'}
                  {uploadProgress >= 60 && uploadProgress < 90 && 'Parsing criteria...'}
                  {uploadProgress >= 90 && '✅ Ready'}
                </span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
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
                  <TableHead>Enrollment</TableHead>
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
