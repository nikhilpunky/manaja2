import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import LoanCard from "@/components/LoanCard";
import ProcessStep from "@/components/ProcessStep";
import FeatureCard from "@/components/FeatureCard";
import TestimonialCard from "@/components/TestimonialCard";
import LoanComparisonCalculator from "@/components/LoanComparisonCalculator";
import { CreditCard, BadgeCheck, FileCheck } from "lucide-react";

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loans Against Your Mutual Fund Investments
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Unlock the value of your mutual fund portfolio with quick, hassle-free loans. Apply with our simple digital KYC process and get funding without selling your investments.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Link href="/apply">
                <Button size="lg">Apply Now</Button>
              </Link>
              <Link href="/#calculator">
                <Button size="lg" variant="outline">Calculate Savings</Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=600&h=400" 
              alt="Financial planning" 
              className="rounded-lg shadow-lg w-full" 
            />
          </div>
        </div>
      </div>

      {/* Loan Process Steps */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">How Our Loan Process Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProcessStep 
              number={1} 
              title="Apply Online" 
              description="Fill out our simple application form with your details. It only takes 5 minutes."
            />
            <ProcessStep 
              number={2} 
              title="Digital KYC" 
              description="Complete your KYC instantly with Aadhaar and PAN verification."
            />
            <ProcessStep 
              number={3} 
              title="Get Instant Approval" 
              description="Our AI assessment provides quick decisions based on your profile."
            />
          </div>
        </div>
      </div>

      {/* Loan Calculator Section */}
      <div className="py-16 bg-white" id="calculator">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Compare and Save</h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            See how much you can save by choosing a loan against your mutual funds instead of a traditional personal loan.
          </p>
          <LoanComparisonCalculator />
        </div>
      </div>

      {/* Loan Options */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">Our Mutual Fund Loan Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <LoanCard 
              title="Short-Term MF Loan"
              description="Quick loans against your mutual fund investments with flexible repayment options."
              features={["Interest rate from 8.99%", "Loan amount up to ₹5,00,000", "Tenure up to 12 months"]}
              interestRate="8.99%"
              maxAmount="₹5,00,000"
              tenure="12 months"
              accentColor="primary"
            />
            
            <LoanCard 
              title="Medium-Term MF Loan"
              description="Leverage your mutual fund portfolio for medium-term financial needs with competitive rates."
              features={["Interest rate from 9.49%", "Loan amount up to ₹10,00,000", "Tenure up to 36 months"]}
              interestRate="9.49%"
              maxAmount="₹10,00,000"
              tenure="36 months"
              accentColor="secondary"
            />
            
            <LoanCard 
              title="Long-Term MF Loan"
              description="Strategic financing against your long-term mutual fund investments with favorable terms."
              features={["Interest rate from 9.99%", "Loan amount up to ₹20,00,000", "Tenure up to 60 months"]}
              interestRate="9.99%"
              maxAmount="₹20,00,000"
              tenure="60 months"
              accentColor="accent"
            />
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Advanced eKYC Integration</h2>
              <p className="text-gray-600 mb-6">Our platform seamlessly integrates with leading eKYC providers to verify your identity instantly:</p>
              
              <div className="space-y-4">
                <FeatureCard 
                  icon={<CreditCard className="text-white" size={18} />}
                  title="Aadhaar Verification"
                  description="Verify your identity using Aadhaar-based authentication"
                  color="primary"
                />
                
                <FeatureCard 
                  icon={<BadgeCheck className="text-white" size={18} />}
                  title="PAN Verification"
                  description="Instant PAN card verification to validate your financial details"
                  color="secondary"
                />
                
                <FeatureCard 
                  icon={<FileCheck className="text-white" size={18} />}
                  title="Bank Account Verification"
                  description="Securely validate your bank account for quick disbursement"
                  color="accent"
                />
              </div>
            </div>
            
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=600&h=400" 
                alt="KYC Verification" 
                className="rounded-lg shadow-lg w-full" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">What Our Customers Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              rating={5}
              text="I needed funds for my child's education but didn't want to sell my mutual fund investments. This platform let me get a loan against my portfolio within hours!"
              name="Amit Malhotra"
              role="Investment Manager"
              initials="AM"
            />
            
            <TestimonialCard 
              rating={4.5}
              text="The mutual fund loan application process was seamless. I could keep my investments intact while getting the liquidity I needed for my business."
              name="Priya Sharma"
              role="Financial Advisor"
              initials="PS"
            />
            
            <TestimonialCard 
              rating={5}
              text="I was able to leverage my long-term mutual fund investments without disrupting my wealth creation strategy. The rates were better than a personal loan too!"
              name="Rajesh Joshi"
              role="Investment Banker"
              initials="RJ"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-6">Unlock the Value of Your Mutual Fund Investments</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">Get the liquidity you need without disrupting your long-term investment strategy. Apply for a mutual fund loan today with our seamless digital process and enjoy quick approvals.</p>
          <Link href="/apply">
            <Button variant="secondary" size="lg">Get Started Today</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
