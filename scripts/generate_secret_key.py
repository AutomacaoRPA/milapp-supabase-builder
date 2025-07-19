#!/usr/bin/env python3
"""
Script para gerar SECRET_KEY segura para o MILAPP
"""

import secrets
import string
import os


def generate_secure_secret_key(length=64):
    """Gerar SECRET_KEY segura"""
    # Caracteres permitidos para a chave
    characters = string.ascii_letters + string.digits + "!@#$%^&*()_+-="
    
    # Gerar chave aleatória
    secret_key = ''.join(secrets.choice(characters) for _ in range(length))
    
    return secret_key


def update_env_file(secret_key):
    """Atualizar arquivo .env com a nova SECRET_KEY"""
    env_file = ".env"
    
    if os.path.exists(env_file):
        # Ler arquivo atual
        with open(env_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Substituir SECRET_KEY
        lines = content.split('\n')
        updated_lines = []
        
        for line in lines:
            if line.startswith('SECRET_KEY='):
                updated_lines.append(f'SECRET_KEY={secret_key}')
            else:
                updated_lines.append(line)
        
        # Escrever arquivo atualizado
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(updated_lines))
        
        print(f"✅ Arquivo {env_file} atualizado com nova SECRET_KEY")
    else:
        print(f"⚠️  Arquivo {env_file} não encontrado")
        print(f"📝 Adicione manualmente: SECRET_KEY={secret_key}")


def main():
    """Função principal"""
    print("🔐 MILAPP - Gerador de SECRET_KEY Segura")
    print("=" * 50)
    
    # Gerar chave segura
    secret_key = generate_secure_secret_key(64)
    
    print(f"🔑 Nova SECRET_KEY gerada:")
    print(f"   {secret_key}")
    print()
    print(f"📏 Comprimento: {len(secret_key)} caracteres")
    print(f"🔒 Entropia: {len(set(secret_key))} caracteres únicos")
    
    # Verificar se é segura
    if len(secret_key) >= 32:
        print("✅ Chave atende aos requisitos mínimos de segurança")
    else:
        print("❌ Chave não atende aos requisitos mínimos")
        return
    
    # Perguntar se quer atualizar o arquivo .env
    response = input("\n📝 Atualizar arquivo .env? (s/n): ").strip().lower()
    
    if response in ['s', 'sim', 'y', 'yes']:
        update_env_file(secret_key)
    else:
        print("\n📋 Copie manualmente a SECRET_KEY para seu arquivo .env:")
        print(f"SECRET_KEY={secret_key}")
    
    print("\n🎉 Processo concluído!")


if __name__ == "__main__":
    main() 