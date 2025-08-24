"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Mail, Calendar, Shield, Trash2, Users } from "lucide-react"

interface User {
  id: string
  email: string
  isAdmin: boolean
  createdAt: string
  documentCount: number
}

interface UserManagementProps {
  onStatsUpdate: () => void
}

export function UserManagement({ onStatsUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          isAdmin: newUserIsAdmin,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("User created successfully!")
        setNewUserEmail("")
        setNewUserPassword("")
        setNewUserIsAdmin(false)
        setShowCreateUser(false)
        fetchUsers()
        onStatsUpdate()
      } else {
        setError(data.error || "Failed to create user")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccess("User deleted successfully!")
        fetchUsers()
        onStatsUpdate()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete user")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="text-muted-foreground">{users.length} total users</p>
        </div>
        <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  minLength={8}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAdmin"
                  checked={newUserIsAdmin}
                  onCheckedChange={(checked) => setNewUserIsAdmin(checked as boolean)}
                />
                <Label htmlFor="isAdmin">Administrator privileges</Label>
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Users List */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{user.email}</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Created {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {user.isAdmin && (
                  <Badge variant="secondary">
                    <Shield className="mr-1 h-3 w-3" />
                    Admin
                  </Badge>
                )}
                <Badge variant="outline">{user.documentCount} docs</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id, user.email)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No users found</h3>
            <p className="text-muted-foreground text-center mb-4">Create your first user to get started</p>
            <Button onClick={() => setShowCreateUser(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
