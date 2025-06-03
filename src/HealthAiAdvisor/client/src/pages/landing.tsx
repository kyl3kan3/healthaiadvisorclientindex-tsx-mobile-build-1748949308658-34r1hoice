import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";
import { PillBottle, Shield, Brain, Heart } from "lucide-react";

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleAuthToggle = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <PillBottle className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Decent4</span>
          </div>
          <AuthForm mode={authMode} onToggleMode={handleAuthToggle} />
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={() => setShowAuth(false)}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <PillBottle className="text-white h-6 w-6" />
              </div>
              <h1 className="text-xl font-semibold text-neutral-800">Decent4</h1>
            </div>
            <Button onClick={() => setShowAuth(true)} className="bg-primary text-white hover:bg-primary-dark">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-neutral-800 mb-6">
            AI-Powered Health
            <br />
            <span className="text-primary">Supplement Recommendations</span>
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8">
            Get personalized supplement recommendations based on your health profile, goals, and optional bloodwork analysis using advanced AI technology.
          </p>
          <Button 
            onClick={() => setShowAuth(true)}
            size="lg"
            className="bg-primary text-white hover:bg-primary-dark px-8 py-4 text-lg"
          >
            Start Your Health Assessment
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-neutral-800 mb-2">AI-Powered Analysis</h3>
              <p className="text-sm text-neutral-600">Advanced AI analyzes your health data for personalized recommendations</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-neutral-800 mb-2">Safety First</h3>
              <p className="text-sm text-neutral-600">All recommendations consider your medical history and potential interactions</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-neutral-800 mb-2">Bloodwork Integration</h3>
              <p className="text-sm text-neutral-600">Upload bloodwork for deeper insights and targeted recommendations</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <PillBottle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-neutral-800 mb-2">Personalized Plans</h3>
              <p className="text-sm text-neutral-600">Tailored supplement plans based on your unique health goals</p>
            </CardContent>
          </Card>
        </div>

        {/* Medical Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-4xl mx-auto">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">Medical Disclaimer</h4>
              <p className="text-sm text-yellow-700">
                These recommendations are for informational purposes only and should not replace professional medical advice. 
                Always consult with your healthcare provider before starting any new supplement regimen, especially if you have 
                medical conditions or take medications.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
