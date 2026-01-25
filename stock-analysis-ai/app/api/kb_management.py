"""KB Management API endpoints"""
from fastapi import APIRouter, HTTPException, Query
from app.models import (
    KBUpdateRequest, KBDocument, KBCandidate,
    CandidateApproveRequest, CandidateRejectRequest, CandidateModifyRequest,
    DocumentsListResponse
)
from app.services.document_service import DocumentService
from app.services.candidate_review_service import CandidateReviewService
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize services (singleton pattern)
_document_service: DocumentService = None
_candidate_service: CandidateReviewService = None

def get_document_service() -> DocumentService:
    """Get or create DocumentService instance"""
    global _document_service
    if _document_service is None:
        _document_service = DocumentService()
        logger.info("DocumentService initialized for KB management API")
    return _document_service

def get_candidate_service() -> CandidateReviewService:
    """Get or create CandidateReviewService instance"""
    global _candidate_service
    if _candidate_service is None:
        _candidate_service = CandidateReviewService()
        logger.info("CandidateReviewService initialized for KB management API")
    return _candidate_service

# ===== Document Endpoints =====

@router.post("/documents", response_model=KBDocument, status_code=201)
async def create_document(request: KBUpdateRequest) -> KBDocument:
    """
    Create a new KB document
    
    The document will be automatically chunked, embedded, and stored in the vector database.
    """
    try:
        service = get_document_service()
        document = await service.create_document(request, created_by="api_user")
        logger.info(f"Document created: {document.doc_id}")
        return document
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating document: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/documents/{doc_id}", response_model=KBDocument)
async def get_document(doc_id: str) -> KBDocument:
    """Get a KB document by ID"""
    try:
        service = get_document_service()
        document = service.get_document(doc_id)
        return document
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting document: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/documents/{doc_id}", response_model=KBDocument)
async def update_document(doc_id: str, request: KBUpdateRequest) -> KBDocument:
    """
    Update an existing KB document
    
    The document will be re-chunked, re-embedded, and version will be incremented.
    Old chunks will be deleted from the vector store.
    """
    try:
        service = get_document_service()
        document = await service.update_document(doc_id, request, updated_by="api_user")
        logger.info(f"Document updated: {doc_id} (version: {document.version})")
        return document
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating document: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(doc_id: str):
    """
    Delete a KB document (soft delete)
    
    The document and all its chunks will be marked as deleted.
    Chunks will be removed from the vector store.
    """
    try:
        service = get_document_service()
        await service.delete_document(doc_id)
        logger.info(f"Document deleted: {doc_id}")
        return None
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting document: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/documents", response_model=DocumentsListResponse)
async def list_documents(
    kb_id: Optional[str] = Query(None, description="Filter by knowledge base ID"),
    status: Optional[str] = Query(None, description="Filter by status (active, archived, deleted)"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
) -> DocumentsListResponse:
    """List documents with optional filters"""
    try:
        service = get_document_service()
        documents, total = service.list_documents(kb_id=kb_id, status=status, limit=limit, offset=offset)
        return DocumentsListResponse(
            items=documents,
            total=total,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        logger.error(f"Error listing documents: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ===== Candidate Endpoints =====

@router.get("/candidates", response_model=List[KBCandidate])
async def get_candidates(
    kb_id: Optional[str] = Query(None, description="Filter by knowledge base ID"),
    status: Optional[str] = Query(None, description="Filter by status (pending, approved, rejected, modified)"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
) -> List[KBCandidate]:
    """Get KB candidates with optional filters"""
    try:
        service = get_candidate_service()
        candidates = service.get_candidates(kb_id=kb_id, status=status, limit=limit, offset=offset)
        return candidates
    except Exception as e:
        logger.error(f"Error getting candidates: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/candidates/{candidate_id}/approve", response_model=KBDocument, status_code=201)
async def approve_candidate(candidate_id: str, request: CandidateApproveRequest) -> KBDocument:
    """
    Approve a KB candidate and convert it to a document
    
    The candidate will be converted to a document, chunked, embedded, and stored.
    """
    try:
        service = get_candidate_service()
        document = await service.approve_candidate(
            candidate_id=candidate_id,
            reviewer=request.reviewer,
            notes=request.notes
        )
        logger.info(f"Candidate {candidate_id} approved, created document {document.doc_id}")
        return document
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error approving candidate: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/candidates/{candidate_id}/reject", status_code=200)
async def reject_candidate(candidate_id: str, request: CandidateRejectRequest):
    """
    Reject a KB candidate
    
    The candidate status will be updated to 'rejected'.
    """
    try:
        service = get_candidate_service()
        service.reject_candidate(
            candidate_id=candidate_id,
            reviewer=request.reviewer,
            notes=request.notes
        )
        logger.info(f"Candidate {candidate_id} rejected")
        return {"status": "rejected", "candidate_id": candidate_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error rejecting candidate: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/candidates/{candidate_id}/modify", response_model=KBDocument, status_code=201)
async def modify_candidate(candidate_id: str, request: CandidateModifyRequest) -> KBDocument:
    """
    Modify a KB candidate and approve it
    
    The candidate will be modified according to the provided document request,
    then converted to a document, chunked, embedded, and stored.
    """
    try:
        service = get_candidate_service()
        document = await service.modify_candidate(
            candidate_id=candidate_id,
            request=request.document,
            reviewer=request.reviewer,
            notes=request.notes
        )
        logger.info(f"Candidate {candidate_id} modified and approved, created document {document.doc_id}")
        return document
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error modifying candidate: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/candidates/{candidate_id}/reimport", response_model=KBDocument, status_code=201)
async def reimport_candidate(candidate_id: str, request: CandidateApproveRequest) -> KBDocument:
    """
    Re-import an approved candidate (create a new document from it)
    
    This allows re-approving a candidate that was already approved, creating a new document.
    """
    try:
        service = get_candidate_service()
        document = await service.reimport_candidate(
            candidate_id=candidate_id,
            reviewer=request.reviewer,
            notes=request.notes
        )
        logger.info(f"Candidate {candidate_id} re-imported, created document {document.doc_id}")
        return document
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error re-importing candidate: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
