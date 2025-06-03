import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface Supplement {
  name: string;
  dosage: string;
  priority: "High" | "Medium" | "Low";
  reason: string;
  safetyRating: string;
  interactions: string[];
  category: string;
}

interface RecommendationCardsProps {
  supplements: Supplement[];
}

export function RecommendationCards({ supplements }: RecommendationCardsProps) {
  if (!supplements || supplements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500">No supplements recommended at this time.</p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSafetyIcon = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "excellent":
      case "good":
        return <Shield className="h-4 w-4 text-green-600" />;
      case "caution":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Shield className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {supplements.map((supplement, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-neutral-800 mb-1">
                  {supplement.name}
                </h4>
                <p className="text-sm text-neutral-600 mb-2">
                  {supplement.dosage}
                </p>
              </div>
              <Badge className={getPriorityColor(supplement.priority)}>
                {supplement.priority} Priority
              </Badge>
            </div>

            <p className="text-sm text-neutral-700 mb-4 line-clamp-3">
              {supplement.reason}
            </p>

            {/* Category */}
            <div className="mb-3">
              <Badge variant="outline" className="text-xs">
                {supplement.category.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Safety Rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-neutral-500">
                {getSafetyIcon(supplement.safetyRating)}
                <span>Safety: {supplement.safetyRating}</span>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="link" 
                    size="sm"
                    className="text-primary text-xs p-0 h-auto"
                  >
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{supplement.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Dosage</h4>
                      <p className="text-sm text-neutral-600">{supplement.dosage}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Why This Supplement</h4>
                      <p className="text-sm text-neutral-600">{supplement.reason}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Priority</h4>
                        <Badge className={getPriorityColor(supplement.priority)}>
                          {supplement.priority}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Category</h4>
                        <Badge variant="outline">
                          {supplement.category.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Safety Rating</h4>
                      <div className="flex items-center space-x-2">
                        {getSafetyIcon(supplement.safetyRating)}
                        <span className="text-sm">{supplement.safetyRating}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Drug Interactions</h4>
                      <div className="space-y-1">
                        {supplement.interactions && supplement.interactions.length > 0 ? (
                          supplement.interactions.map((interaction, idx) => {
                            const isNoInteraction = interaction.toLowerCase().includes('no known interactions') || 
                                                   interaction.toLowerCase().includes('no interactions') ||
                                                   interaction.toLowerCase().includes('none identified');
                            return (
                              <p 
                                key={idx} 
                                className={`text-sm p-2 rounded ${
                                  isNoInteraction 
                                    ? 'text-green-700 bg-green-50 border border-green-200' 
                                    : 'text-amber-700 bg-amber-50 border border-amber-200'
                                }`}
                              >
                                {interaction}
                              </p>
                            );
                          })
                        ) : (
                          <p className="text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
                            No interaction data available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Interactions Warning */}
            {supplement.interactions && supplement.interactions.length > 0 && (
              (() => {
                const hasNoInteractions = supplement.interactions.some(interaction => 
                  interaction.toLowerCase().includes('no known interactions') || 
                  interaction.toLowerCase().includes('no interactions') ||
                  interaction.toLowerCase().includes('none identified')
                );
                
                return (
                  <div className={`mt-3 p-2 border rounded text-xs ${
                    hasNoInteractions 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className={`flex items-center space-x-1 ${
                      hasNoInteractions ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {hasNoInteractions ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      <span className="font-medium">
                        {hasNoInteractions ? 'Safe with Current Medications:' : 'Potential Interactions:'}
                      </span>
                    </div>
                    <ul className={`mt-1 ml-4 list-disc ${
                      hasNoInteractions ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {supplement.interactions.slice(0, 2).map((interaction, idx) => (
                        <li key={idx}>{interaction}</li>
                      ))}
                      {supplement.interactions.length > 2 && (
                        <li>+{supplement.interactions.length - 2} more...</li>
                      )}
                    </ul>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
