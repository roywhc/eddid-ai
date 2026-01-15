#!/usr/bin/env python3
"""
Example usage of the Stock Analysis Generator

This script demonstrates how to use the StockAnalysisGenerator class
programmatically to generate and manage stock analysis reports.
"""

from stock_analyzer import StockAnalysisGenerator
from datetime import datetime
import json


def example_basic_usage():
    """Basic example: Generate and save a report."""
    print("=" * 80)
    print("Example 1: Basic Usage - Generate and Save Report")
    print("=" * 80)
    
    # Initialize generator
    generator = StockAnalysisGenerator(knowledge_base_dir="./knowledge_base")
    
    # Generate a report
    report = generator.generate_analysis(
        ticker="AAPL",
        analysis_date="2026-01-15",
        model="sonar-pro"
    )
    
    # Save to knowledge base
    saved_path = generator.save_report(report)
    print(f"\nReport saved to: {saved_path}")
    
    return report


def example_with_focus_areas():
    """Example with focus areas."""
    print("\n" + "=" * 80)
    print("Example 2: Generate Report with Focus Areas")
    print("=" * 80)
    
    generator = StockAnalysisGenerator(knowledge_base_dir="./knowledge_base")
    
    report = generator.generate_analysis(
        ticker="MSFT",
        analysis_date="2026-01-15",
        focus_areas="cloud growth, AI monetization, and enterprise adoption",
        model="sonar-pro"
    )
    
    generator.save_report(report)
    print("\nReport generated and saved.")


def example_load_existing():
    """Example: Load an existing report."""
    print("\n" + "=" * 80)
    print("Example 3: Load Existing Report")
    print("=" * 80)
    
    generator = StockAnalysisGenerator(knowledge_base_dir="./knowledge_base")
    
    # Try to load a report
    report = generator.load_report("AAPL", "2026-01-15")
    
    if report:
        print(f"\nFound report for {report['ticker']} on {report['analysis_date']}")
        print(f"Generated at: {report['generated_at']}")
        print(f"Model used: {report['model']}")
        print(f"\nToken usage:")
        print(f"  Prompt tokens: {report['usage'].get('prompt_tokens')}")
        print(f"  Completion tokens: {report['usage'].get('completion_tokens')}")
        print(f"  Total tokens: {report['usage'].get('total_tokens')}")
        
        # Display a portion of the analysis
        if 'analysis' in report:
            analysis = report['analysis']
            if 'meta' in analysis:
                print(f"\nCompany: {analysis['meta'].get('company_name')}")
                print(f"Exchange: {analysis['meta'].get('exchange')}")
    else:
        print("Report not found. Generate it first using example_basic_usage().")


def example_list_reports():
    """Example: List all reports."""
    print("\n" + "=" * 80)
    print("Example 4: List All Reports")
    print("=" * 80)
    
    generator = StockAnalysisGenerator(knowledge_base_dir="./knowledge_base")
    
    # List all reports
    all_reports = generator.list_reports()
    
    if all_reports:
        print(f"\nFound {len(all_reports)} report(s):\n")
        for report in all_reports:
            print(f"  {report['ticker']} - {report['analysis_date']}")
            print(f"    Generated: {report['generated_at']}")
            print(f"    Path: {report['file_path']}\n")
    else:
        print("No reports found in knowledge base.")
    
    # List reports for a specific ticker
    print("\n" + "-" * 80)
    print("Filtering by ticker: AAPL")
    print("-" * 80)
    
    aapl_reports = generator.list_reports(ticker="AAPL")
    if aapl_reports:
        print(f"\nFound {len(aapl_reports)} report(s) for AAPL:\n")
        for report in aapl_reports:
            print(f"  {report['analysis_date']} - {report['generated_at']}")
    else:
        print("No reports found for AAPL.")


def example_streaming():
    """Example: Use streaming for real-time feedback."""
    print("\n" + "=" * 80)
    print("Example 5: Streaming Response")
    print("=" * 80)
    
    generator = StockAnalysisGenerator(knowledge_base_dir="./knowledge_base")
    
    print("Generating report with streaming enabled...\n")
    report = generator.generate_analysis(
        ticker="TSLA",
        analysis_date="2026-01-15",
        model="sonar-pro",
        use_streaming=True
    )
    
    generator.save_report(report)
    print("\nStreaming report generated and saved.")


def example_custom_knowledge_base():
    """Example: Use a custom knowledge base directory."""
    print("\n" + "=" * 80)
    print("Example 6: Custom Knowledge Base Directory")
    print("=" * 80)
    
    # Use a different directory
    generator = StockAnalysisGenerator(knowledge_base_dir="./custom_kb")
    
    report = generator.generate_analysis(
        ticker="NVDA",
        analysis_date="2026-01-15",
        model="sonar-pro"
    )
    
    saved_path = generator.save_report(report)
    print(f"\nReport saved to custom location: {saved_path}")


if __name__ == "__main__":
    import sys
    
    print("Stock Analysis Generator - Example Usage")
    print("=" * 80)
    print("\nNote: This script requires a valid PERPLEXITY_API_KEY environment variable.")
    print("Make sure you have set it before running these examples.\n")
    
    # Check if API key is set
    import os
    if not os.getenv("PERPLEXITY_API_KEY"):
        print("ERROR: PERPLEXITY_API_KEY environment variable is not set!")
        print("Please set it before running this script.")
        sys.exit(1)
    
    try:
        # Run examples (comment out the ones you don't want to run)
        # Note: These will make actual API calls and consume your API quota
        
        # Uncomment to run examples:
        # example_basic_usage()
        # example_with_focus_areas()
        # example_load_existing()
        # example_list_reports()
        # example_streaming()
        # example_custom_knowledge_base()
        
        print("\n" + "=" * 80)
        print("Examples are commented out to prevent accidental API usage.")
        print("Uncomment the examples you want to run in the script.")
        print("=" * 80)
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

