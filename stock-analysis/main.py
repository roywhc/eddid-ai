#!/usr/bin/env python3
"""
Main entry point for Stock Analysis Agent System

Provides a chat interface for querying stock analysis information.
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from dotenv import load_dotenv

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.chat_agent import ChatAgent
from src.index_manager import IndexManager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def initialize_knowledge_base(kb_dir: Path):
    """Initialize knowledge base with root index."""
    logger.info("Initializing knowledge base...")
    index_manager = IndexManager(kb_dir)
    root_index = index_manager.initialize_root_index()
    logger.info(f"Knowledge base initialized with {root_index.get('stock_count', 0)} stocks")
    return root_index


def chat_mode(kb_dir: Path, openrouter_key: str = None, perplexity_key: str = None, model: str = "openai/gpt-4o-mini"):
    """Run in interactive chat mode."""
    print("=" * 80)
    print("Stock Analysis Agent System")
    print("=" * 80)
    print(f"Using model: {model}\n")
    print("Type your questions about stocks. Type 'quit' or 'exit' to exit.\n")
    
    # Initialize KB if needed
    initialize_knowledge_base(kb_dir)
    
    # Create chat agent
    agent = ChatAgent(
        knowledge_base_dir=str(kb_dir),
        openrouter_api_key=openrouter_key or os.getenv("OPENROUTER_API_KEY"),
        perplexity_api_key=perplexity_key or os.getenv("PERPLEXITY_API_KEY"),
        model=model
    )
    
    chat_history = []
    
    while True:
        try:
            user_input = input("\nYou: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\nGoodbye!")
                break
            
            if not user_input:
                continue
            
            print("\nAgent: ", end="", flush=True)
            response = agent.chat(user_input, chat_history)
            print(response)
            
            # Add to chat history (simplified)
            chat_history.append(("human", user_input))
            chat_history.append(("ai", response))
            
        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
        except Exception as e:
            logger.error(f"Error in chat mode: {e}")
            print(f"\nError: {e}")


def single_query_mode(kb_dir: Path, query: str, openrouter_key: str = None, perplexity_key: str = None, model: str = "openai/gpt-4o-mini"):
    """Run a single query and exit."""
    # Initialize KB if needed
    initialize_knowledge_base(kb_dir)
    
    # Create chat agent
    agent = ChatAgent(
        knowledge_base_dir=str(kb_dir),
        openrouter_api_key=openrouter_key or os.getenv("OPENROUTER_API_KEY"),
        perplexity_api_key=perplexity_key or os.getenv("PERPLEXITY_API_KEY"),
        model=model
    )
    
    print(f"Query: {query}\n")
    print(f"Using model: {model}\n")
    print("Response:")
    print("-" * 80)
    response = agent.chat(query)
    print(response)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Stock Analysis Agent System - Chat interface for stock analysis queries"
    )
    
    parser.add_argument(
        "--kb-dir",
        default="./knowledge_base",
        help="Knowledge base directory (default: ./knowledge_base)"
    )
    parser.add_argument(
        "--query",
        help="Single query to process (if not provided, runs in interactive mode)"
    )
    parser.add_argument(
        "--openrouter-key",
        help="OpenRouter API key (defaults to OPENROUTER_API_KEY env var)"
    )
    parser.add_argument(
        "--perplexity-key",
        help="Perplexity API key (defaults to PERPLEXITY_API_KEY env var)"
    )
    parser.add_argument(
        "--model",
        default="openai/gpt-4o-mini",
        help="OpenRouter model to use (default: openai/gpt-4o-mini). See https://openrouter.ai/models"
    )
    parser.add_argument(
        "--init-only",
        action="store_true",
        help="Only initialize knowledge base and exit"
    )
    
    args = parser.parse_args()
    
    kb_dir = Path(args.kb_dir)
    kb_dir.mkdir(parents=True, exist_ok=True)
    
    # Check for required API keys
    if not args.init_only:
        openrouter_key = args.openrouter_key or os.getenv("OPENROUTER_API_KEY")
        perplexity_key = args.perplexity_key or os.getenv("PERPLEXITY_API_KEY")
        
        if not openrouter_key:
            print("Error: OPENROUTER_API_KEY environment variable or --openrouter-key required")
            sys.exit(1)
        
        if not perplexity_key:
            print("Warning: PERPLEXITY_API_KEY not set. Perplexity research will not work.")
    
    try:
        if args.init_only:
            initialize_knowledge_base(kb_dir)
            print("Knowledge base initialized successfully.")
        elif args.query:
            single_query_mode(
                kb_dir,
                args.query,
                openrouter_key=args.openrouter_key,
                perplexity_key=args.perplexity_key,
                model=args.model
            )
        else:
            chat_mode(
                kb_dir,
                openrouter_key=args.openrouter_key,
                perplexity_key=args.perplexity_key,
                model=args.model
            )
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

