import { Link } from "react-router-dom";
import { MedSeniorLogo } from "@/components/MedSeniorLogo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink,
  Heart
} from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo e Descrição */}
          <div className="space-y-4">
            <MedSeniorLogo size="md" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Tecnologia inovadora para um envelhecimento ativo e saudável. 
              Centro de Excelência em Automação RPA.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Heart className="h-3 w-3 text-primary" />
              <span>Feito com carinho para bem envelhecer</span>
            </div>
          </div>

          {/* Navegação */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">Navegação</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/projetos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Projetos
                </Link>
              </li>
              <li>
                <Link to="/chat" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Chat IA
                </Link>
              </li>
              <li>
                <Link to="/quality-gates" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Quality Gates
                </Link>
              </li>
              <li>
                <Link to="/deployments" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Deployments
                </Link>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">Recursos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Documentação
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Suporte
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Tutoriais
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>contato@medsenior.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+55 (11) 3000-0000</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>São Paulo, SP - Brasil</span>
              </div>
              
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <a href="https://medsenior.com" target="_blank" rel="noopener noreferrer">
                  Site Oficial
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="mb-4 md:mb-0">
            <p>© 2024 MedSênior. Todos os direitos reservados.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};