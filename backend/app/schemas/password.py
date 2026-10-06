from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional, Literal


# ---------------------------------------------------------------------------------
# 1. DTO для Forgot password
# ---------------------------------------------------------------------------------

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    password: str = Field(min_length=8)
    password_confirmation: str = Field(min_length=8)

class ResetPasswordResponse(BaseModel):
    message: str