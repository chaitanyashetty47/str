"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Filter, Star, MessageSquare } from "lucide-react";

const reports = [
  {
    id: "REP001",
    client: "Alex Johnson",
    type: "Progress Report",
    date: "2024-03-15",
    status: "Generated",
  },
  {
    id: "REP002",
    client: "Maria Garcia",
    type: "Monthly Summary",
    date: "2024-03-01",
    status: "Generated",
  },
  {
    id: "REP003",
    client: "Sam Wilson",
    type: "Assessment",
    date: "2024-02-28",
    status: "Pending",
  },
];

const feedback = [
  {
    client: "Alex Johnson",
    rating: 5,
    comment: "Great progress with the new workout plan. Really feeling stronger!",
    date: "2 days ago",
    program: "Strength Training",
  },
  {
    client: "Maria Garcia",
    rating: 4,
    comment: "The HIIT sessions are challenging but effective. Would like more variety.",
    date: "1 week ago",
    program: "HIIT Cardio",
  },
  {
    client: "Sam Wilson",
    rating: 5,
    comment: "Excellent support and motivation throughout the program.",
    date: "3 days ago",
    program: "Weight Loss Program",
  },
];

const renderStars = (rating: number) => {
  return [...Array(5)].map((_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${
        index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
      }`}
    />
  ));
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Reports & Feedback</h2>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export All Reports
        </Button>
      </div>

      {/* Reports Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Generated Reports</CardTitle>
            <div className="flex gap-4">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="progress">Progress Reports</SelectItem>
                  <SelectItem value="summary">Monthly Summaries</SelectItem>
                  <SelectItem value="assessment">Assessments</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.id}</TableCell>
                  <TableCell>{report.client}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>
                    {/* <Badge
                      variant={report.status === "Generated" ? "success" : "secondary"}
                    >
                      {report.status}
                    </Badge> */}
                  </TableCell>
                  <TableCell>
                    <Button variant="link" size="sm">
                      View Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Feedback Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Client Feedback</CardTitle>
            <Button variant="outline">View All Feedback</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {feedback.map((item, index) => (
              <div
                key={index}
                className="border-b last:border-0 pb-6 last:pb-0"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{item.client}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.program}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(item.rating)}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{item.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 