#!/usr/bin/env python3

import subprocess
import sys

def run_command(command):
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar comando: {e}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return False

def auto_commit(message):
    print("Adicionando todas as alterações...")
    if not run_command(["git", "add", "."]):
        return False

    print(f"Commitando com a mensagem: '{message}'...")
    if not run_command(["git", "commit", "-m", message]):
        return False

    print("Enviando alterações para o repositório remoto...")
    if not run_command(["git", "push"]):
        return False

    print("Automação de commit concluída com sucesso!")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 auto_commit.py \"Sua mensagem de commit\"")
        sys.exit(1)
    
    commit_message = sys.argv[1]
    if not auto_commit(commit_message):
        sys.exit(1)


