import React from 'react';
import { BarChart3, Twitter, Instagram, Mail, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 pt-16 pb-8 border-t border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <BarChart3 className="h-6 w-6 text-violet-500 mr-2" />
              <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
                CrowdLens
              </span>
            </div>
            <p className="text-slate-400 mb-4 text-sm">
              Optimize your content with decentralized feedback from real users.
            </p>
            <div className="flex space-x-4">
              <a href="https://x.com/pratikkale26" target='_blank' className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="https://linkedin.com/in/pratikkale26" target='_blank' className="text-slate-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </a>
              <a href="https://instagram.com/kalep_26" target='_blank' className="text-slate-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm">Features</a></li>
              <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm">How It Works</a></li>
              <li><a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm">Pricing</a></li>
              <li><a href="/stats" className="text-slate-400 hover:text-white transition-colors text-sm">Stats</a></li>
              <li><a href="/case-studies" className="text-slate-400 hover:text-white transition-colors text-sm">Case Studies</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Documentation</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Help Center</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">API Reference</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">About Us</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Careers</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Legal</a></li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} CrowdLens. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-500 hover:text-white text-sm">Privacy Policy</a>
              <a href="#" className="text-slate-500 hover:text-white text-sm">Terms of Service</a>
              <a href="#" className="text-slate-500 hover:text-white text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;