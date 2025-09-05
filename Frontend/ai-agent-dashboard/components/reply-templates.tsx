"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Icons } from "@/components/icons"

interface Template {
  id: string
  name: string
  category: string
  content: string
  variables: string[]
}

export function ReplyTemplates() {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Thank You - Positive Feedback",
      category: "positive",
      content:
        "Thank you so much for the kind words about {product}! We're thrilled to hear it's helping with your {use_case}. If you have any questions or need assistance, feel free to reach out!",
      variables: ["product", "use_case"],
    },
    {
      id: "2",
      name: "Product Inquiry Response",
      category: "neutral",
      content:
        "Thanks for your interest in {product}! It's designed specifically for {industry} professionals like yourself. Would you like to schedule a quick demo to see how it could help with {specific_need}?",
      variables: ["product", "industry", "specific_need"],
    },
    {
      id: "3",
      name: "Issue Resolution",
      category: "negative",
      content:
        "We appreciate you bringing this to our attention. Customer satisfaction is our top priority, and we'd love to make this right. Could you DM us with more details so we can resolve this quickly?",
      variables: [],
    },
  ])

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "neutral",
    content: "",
  })

  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)

  const categories = [
    { value: "positive", label: "Positive Responses", color: "bg-green-100 text-green-800" },
    { value: "neutral", label: "General Inquiries", color: "bg-blue-100 text-blue-800" },
    { value: "negative", label: "Issue Resolution", color: "bg-red-100 text-red-800" },
    { value: "promotional", label: "Promotional", color: "bg-purple-100 text-purple-800" },
  ]

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{([^}]+)\}/g)
    return matches ? matches.map((match) => match.slice(1, -1)) : []
  }

  const addTemplate = () => {
    if (newTemplate.name && newTemplate.content) {
      const template: Template = {
        id: Date.now().toString(),
        name: newTemplate.name,
        category: newTemplate.category,
        content: newTemplate.content,
        variables: extractVariables(newTemplate.content),
      }
      setTemplates([...templates, template])
      setNewTemplate({ name: "", category: "neutral", content: "" })
    }
  }

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id))
  }

  const getCategoryColor = (category: string) => {
    const categoryObj = categories.find((c) => c.value === category)
    return categoryObj?.color || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.message className="h-5 w-5" />
            Reply Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template List */}
          <div className="space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge className={getCategoryColor(template.category)}>
                      {categories.find((c) => c.value === template.category)?.label}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingTemplate(template.id)}>
                      <Icons.settings className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteTemplate(template.id)}>
                      <Icons.xCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{template.content}</p>

                {template.variables.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">Variables:</span>
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add New Template */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium">Add New Template</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Product Demo Offer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Select
                  value={newTemplate.category}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-content">Template Content</Label>
              <Textarea
                id="template-content"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                placeholder="Use {variable_name} for dynamic content..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Use curly braces for variables: {"{product}"}, {"{industry}"}, {"{use_case}"}
              </p>
            </div>

            <Button onClick={addTemplate} disabled={!newTemplate.name || !newTemplate.content}>
              <Icons.message className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
