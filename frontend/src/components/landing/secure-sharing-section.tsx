"use client";

import { motion } from "framer-motion";
import { FileUp, Shield, UploadCloud, Link as LinkIcon, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SecureSharingSection() {
  return (
    <section className="py-24 border-b bg-muted/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Shield className="w-4 h-4 mr-2" /> Bank-Grade Security
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Secure Document Sharing
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Don't risk your sensitive files on public networks. Our encrypted sharing vault lets you upload documents securely before you arrive and access them only when authenticated at the terminal.
            </p>
            <ul className="space-y-4 pt-4">
              <li className="flex items-start gap-3">
                <div className="bg-background border shadow-sm p-2 rounded-lg mt-1">
                  <UploadCloud className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Pre-Upload via Web or App</h4>
                  <p className="text-muted-foreground text-sm">Upload files from home using our secure portal.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-background border shadow-sm p-2 rounded-lg mt-1">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Terminal-Only Access</h4>
                  <p className="text-muted-foreground text-sm">Files are only decrypted when you actively log into a cafe terminal.</p>
                </div>
              </li>
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-20" />
            <Card className="relative border shadow-2xl bg-card overflow-hidden">
              <div className="border-b bg-muted/50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="text-xs font-mono text-muted-foreground flex items-center bg-background px-3 py-1 rounded-full border">
                  <LinkIcon className="w-3 h-3 mr-2" /> secure.cybersaas.com/vault
                </div>
              </div>
              <CardContent className="p-8">
                <div className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-background rounded-full shadow-sm">
                    <FileUp className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Drop your files here</h3>
                    <p className="text-sm text-muted-foreground max-w-[250px] mt-1">
                      Files are encrypted end-to-end and stored securely.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
