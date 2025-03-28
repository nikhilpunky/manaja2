import { Link } from "wouter";
import { Facebook, Linkedin, Globe } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Pledgenfetch</h3>
            <p className="text-gray-400 text-sm">A modern digital lending platform with seamless eKYC integration and instant approvals.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              <li><Link href="/apply"><a className="text-gray-400 hover:text-white text-sm">Personal Loans</a></Link></li>
              <li><Link href="/apply"><a className="text-gray-400 hover:text-white text-sm">Business Loans</a></Link></li>
              <li><Link href="/apply"><a className="text-gray-400 hover:text-white text-sm">Education Loans</a></Link></li>
              <li><Link href="/apply"><a className="text-gray-400 hover:text-white text-sm">Home Loans</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/#calculator"><a className="text-gray-400 hover:text-white text-sm">Loan Calculator</a></Link></li>
              <li><Link href="/#eligibility"><a className="text-gray-400 hover:text-white text-sm">Eligibility Criteria</a></Link></li>
              <li><Link href="/#faq"><a className="text-gray-400 hover:text-white text-sm">FAQs</a></Link></li>
              <li><Link href="/#blog"><a className="text-gray-400 hover:text-white text-sm">Blog</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-400 text-sm">
                <span className="material-icons mr-2 text-sm">email</span>
                support@pledgenfetch.com
              </li>
              <li className="flex items-center text-gray-400 text-sm">
                <span className="material-icons mr-2 text-sm">phone</span>
                +91 9876543210
              </li>
              <li className="flex items-center text-gray-400 text-sm">
                <span className="material-icons mr-2 text-sm">location_on</span>
                Mumbai, India
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Pledgenfetch. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <Linkedin size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <Globe size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
