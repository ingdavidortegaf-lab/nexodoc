from fastapi import APIRouter

from app.api.v1 import admin, auth, catalog, orders, payments, requests

router = APIRouter(prefix="/v1")
router.include_router(auth.router)
router.include_router(catalog.router)
router.include_router(orders.router)
router.include_router(payments.router)
router.include_router(requests.router)
router.include_router(admin.router)
