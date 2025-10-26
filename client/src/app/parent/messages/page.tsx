"use client";
import { useState } from "react";
import DashboardLayout from "../../components/ui/dashboard-layout";
import RoleGuard from "../../components/ui/role-guard";
import { useAuthStore } from "../../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  Inbox,
  Send as SendIcon,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  Mail,
} from "lucide-react";

export default function Messages() {
  const user = useAuthStore((s) => s.user);
  const [newMessage, setNewMessage] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");

  // Mock data - in a real app, this would come from an API
  const messages = [
    {
      id: "1",
      type: "received",
      subject: "Parent-Teacher Conference Reminder",
      from: "Mrs. Johnson (Mathematics Teacher)",
      to: "You",
      content:
        "This is a reminder about our upcoming parent-teacher conference scheduled for next Tuesday at 2:00 PM. We'll discuss your child's progress in mathematics and set goals for the next term.",
      date: "2024-01-15T10:30:00Z",
      read: false,
      priority: "normal",
    },
    {
      id: "2",
      type: "sent",
      subject: "Question about homework assignment",
      from: "You",
      to: "Mr. Smith (Science Teacher)",
      content:
        "Hi Mr. Smith, I hope this message finds you well. My child mentioned they were having difficulty with the recent homework assignment on chemical reactions. Could you please provide some additional guidance or resources?",
      date: "2024-01-14T16:45:00Z",
      read: true,
      priority: "normal",
    },
    {
      id: "3",
      type: "received",
      subject: "Excellent Progress Report",
      from: "Principal Williams",
      to: "You",
      content:
        "Congratulations! Your child has shown excellent progress this term. Their attendance, participation, and academic performance have been outstanding. Keep up the great work!",
      date: "2024-01-12T09:15:00Z",
      read: true,
      priority: "high",
    },
  ];

  const teachers = [
    {
      id: "1",
      name: "Mrs. Johnson",
      subject: "Mathematics",
      email: "johnson@school.edu",
    },
    {
      id: "2",
      name: "Mr. Smith",
      subject: "Science",
      email: "smith@school.edu",
    },
    {
      id: "3",
      name: "Ms. Davis",
      subject: "English",
      email: "davis@school.edu",
    },
    {
      id: "4",
      name: "Principal Williams",
      subject: "Administration",
      email: "williams@school.edu",
    },
  ];

  const handleSendMessage = () => {
    if (!newMessage.trim() || !messageSubject.trim() || !selectedRecipient) {
      return;
    }

    // In a real app, this would send the message via API
    console.log("Sending message:", {
      subject: messageSubject,
      content: newMessage,
      recipient: selectedRecipient,
    });

    // Reset form
    setNewMessage("");
    setMessageSubject("");
    setSelectedRecipient("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = messages.filter(
    (m) => !m.read && m.type === "received"
  ).length;

  return (
    <RoleGuard allowed={["parent"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
              <p className="text-muted-foreground">
                Communicate with teachers and school staff.
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              Parent Portal
            </Badge>
          </div>

          <Tabs defaultValue="inbox" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inbox" className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Inbox
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <SendIcon className="h-4 w-4" />
                Sent
              </TabsTrigger>
              <TabsTrigger value="compose" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Compose
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="space-y-4">
              {messages
                .filter((m) => m.type === "received")
                .map((message) => (
                  <Card
                    key={message.id}
                    className={`hover:shadow-lg transition-shadow ${
                      !message.read ? "border-blue-200 bg-blue-50" : ""
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {!message.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                            {message.subject}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground">
                              From: {message.from}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(message.date)}
                            </span>
                          </div>
                        </div>
                        {message.priority === "high" && (
                          <Badge variant="destructive" className="text-xs">
                            Important
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-4">
                        {message.content}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                        <Button size="sm" variant="outline">
                          Mark as Read
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {messages.filter((m) => m.type === "received").length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Mail className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Messages
                    </h3>
                    <p className="text-gray-500 text-center">
                      You haven't received any messages yet. Messages from
                      teachers will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {messages
                .filter((m) => m.type === "sent")
                .map((message) => (
                  <Card
                    key={message.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        {message.subject}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">
                          To: {message.to}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(message.date)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-4">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">
                          Delivered
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {messages.filter((m) => m.type === "sent").length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Send className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Sent Messages
                    </h3>
                    <p className="text-gray-500 text-center">
                      Messages you send to teachers will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="compose" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Compose New Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Recipient
                    </label>
                    <select
                      value={selectedRecipient}
                      onChange={(e) => setSelectedRecipient(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a teacher...</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} ({teacher.subject})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Subject
                    </label>
                    <Input
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      placeholder="Enter message subject..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Message
                    </label>
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      rows={6}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Save Draft</Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        !newMessage.trim() ||
                        !messageSubject.trim() ||
                        !selectedRecipient
                      }
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Send Message
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <Users className="h-6 w-6" />
                      <span className="text-sm">Schedule Meeting</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <AlertTriangle className="h-6 w-6" />
                      <span className="text-sm">Report Concern</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <Clock className="h-6 w-6" />
                      <span className="text-sm">Request Update</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
