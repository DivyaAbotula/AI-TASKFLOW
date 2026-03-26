import React from 'react';
import { Brain, Mail, Phone, Globe, Linkedin, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center transform rotate-12">
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  AI TaskFlow: An Intelligent Goal Decomposition
and Task Scheduling System
                </span>
                <div className="text-xs text-green-500 font-medium"></div>
              </div>
            </div>
            <p className="text-gray-600 mb-6 max-w-md leading-relaxed">
              Experience the future of task management with AI that understands your workflow, 
              automatically prioritizes tasks, and helps you achieve more with intelligent automation.
            </p>
          </div>
          
          <div>
            <h3 className="text-gray-900 font-semibold mb-4 flex items-center">
              AI Features
            </h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-600 hover:text-green-500 transition-colors duration-200">Smart Breakdown</a></li>
              <li><a href="#" className="text-gray-600 hover:text-green-500 transition-colors duration-200">Auto Prioritization</a></li>
              <li><a href="#" className="text-gray-600 hover:text-green-500 transition-colors duration-200">Smart Scheduling</a></li>
              <li><a href="#" className="text-gray-600 hover:text-green-500 transition-colors duration-200">AI Analytics</a></li>
            </ul>
          </div>
          
       
        </div>
        
 

      </div>
    </footer>
  );
};

export default Footer;
