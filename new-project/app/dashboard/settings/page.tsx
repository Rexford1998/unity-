"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Copy, 
  Check,
  ExternalLink,
  Box
} from "lucide-react"

export default function SettingsPage() {
  const [copied, setCopied] = useState<string | null>(null)
  
  // Mock user data
  const user = {
    name: "Alex Chen",
    email: "alex@example.com",
    apiKey: "mf_live_sk_1234567890abcdefghijklmnop",
    webhookUrl: "",
  }

  const [webhookUrl, setWebhookUrl] = useState(user.webhookUrl)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and integrations</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={user.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        {/* API Key Section */}
        <Card>
          <CardHeader>
            <CardTitle>API Key</CardTitle>
            <CardDescription>Use this key to authenticate API requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-lg font-mono text-sm">
                  <span className="truncate">{user.apiKey}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(user.apiKey, "api")}
                >
                  {copied === "api" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Keep your API key secret. Do not share it or expose it in client-side code.
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="webhook">Webhook URL</Label>
              <Input
                id="webhook"
                placeholder="https://your-server.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Receive notifications when asset generation is complete.
              </p>
            </div>
            <div className="flex justify-end">
              <Button>Save Webhook</Button>
            </div>
          </CardContent>
        </Card>

        {/* Connected Apps Section */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Apps</CardTitle>
            <CardDescription>Integrate MeshForge with your favorite tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Blender Plugin */}
            <div className="flex items-center justify-between p-4 border border-border rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E87D0D]/10 rounded-xl flex items-center justify-center">
                  <Box className="w-6 h-6 text-[#E87D0D]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Blender Plugin</h4>
                    <Badge variant="secondary" className="text-xs">v2.1.0</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Generate and import assets directly in Blender</p>
                </div>
              </div>
              <Button variant="outline">
                Download
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Unity Plugin */}
            <div className="flex items-center justify-between p-4 border border-border rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-foreground/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10.4 17.8L4.5 12l5.9-5.8L9 4.7l-7.5 7.3 7.5 7.3 1.4-1.5zm3.2 0l5.9-5.8-5.9-5.8L15 4.7l7.5 7.3-7.5 7.3-1.4-1.5z"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Unity Package</h4>
                    <Badge variant="secondary" className="text-xs">v1.8.0</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Import and manage assets in Unity Editor</p>
                </div>
              </div>
              <Button variant="outline">
                Download
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Unreal Plugin - Coming Soon */}
            <div className="flex items-center justify-between p-4 border border-border rounded-xl opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                  <Box className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Unreal Engine Plugin</h4>
                    <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Native integration for Unreal Engine</p>
                </div>
              </div>
              <Button variant="outline" disabled>
                Notify Me
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Regenerate API Key</p>
                <p className="text-sm text-muted-foreground">
                  This will invalidate your current API key
                </p>
              </div>
              <Button variant="outline">Regenerate</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
