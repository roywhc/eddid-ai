"""
Tool definitions module for tool-based RAG flow

This module contains tool wrappers that expose services as LLM-callable tools:
- knowledge_base_tool: Wraps RetrievalService for KB queries
- perplexity_tool: Wraps PerplexityService for external knowledge
- response_generator_tool: Formats and returns final responses
- index_keywords_tool: Indexes keywords from Perplexity results
"""

# Tool implementations will be imported here as they are created
# from app.services.tools.knowledge_base_tool import KnowledgeBaseTool
# from app.services.tools.perplexity_tool import PerplexityTool
# from app.services.tools.response_generator_tool import ResponseGeneratorTool
# from app.services.tools.index_keywords_tool import IndexKeywordsTool

__all__ = [
    # "KnowledgeBaseTool",
    # "PerplexityTool",
    # "ResponseGeneratorTool",
    # "IndexKeywordsTool",
]
