import unittest
import uuid

from backend.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from backend.database import (
    create_user,
    get_user_auth_by_id,
    get_user_by_email,
    get_user_by_id,
    init_db,
    update_user_api_key,
    update_user_password,
    update_user_profile,
)


class TestAuthAndUserProfile(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        await init_db()

    def test_password_hashing(self):
        """Test bcrypt password hashing and verification."""
        password = "superSecurePassword123"
        hashed = hash_password(password)
        self.assertNotEqual(password, hashed)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("wrongPassword", hashed))

    def test_jwt_token_creation_and_decoding(self):
        """Test JWT token issuance and decoding."""
        user_id = 999
        email = "jwt_test@example.com"
        token = create_access_token(user_id=user_id, email=email)
        self.assertIsInstance(token, str)

        payload = decode_access_token(token)
        self.assertEqual(payload["sub"], str(user_id))
        self.assertEqual(payload["email"], email)

    async def test_user_lifecycle_and_profile_updates(self):
        """Test creating a user, fetching profile, updating profile, and changing password."""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        initial_pw = "initialSecret123"
        hashed_pw = hash_password(initial_pw)

        # 1. Create user
        user_id = await create_user(
            email=unique_email,
            password_hash=hashed_pw,
            full_name="Original Name",
            contact_no="+1234567890",
        )
        self.assertIsInstance(user_id, int)

        # 2. Fetch by ID
        user = await get_user_by_id(user_id)
        self.assertIsNotNone(user)
        self.assertEqual(user["email"], unique_email)
        self.assertEqual(user["full_name"], "Original Name")
        self.assertEqual(user["contact_no"], "+1234567890")

        # 3. Fetch by Email
        user_by_email = await get_user_by_email(unique_email)
        self.assertIsNotNone(user_by_email)
        self.assertEqual(user_by_email["id"], user_id)

        # 4. Update Profile
        updated = await update_user_profile(
            user_id=user_id,
            full_name="Updated Name",
            contact_no="+1987654321",
        )
        self.assertTrue(updated)

        user_after_update = await get_user_by_id(user_id)
        self.assertEqual(user_after_update["full_name"], "Updated Name")
        self.assertEqual(user_after_update["contact_no"], "+1987654321")

        # 5. Fetch auth details (including password_hash)
        user_auth = await get_user_auth_by_id(user_id)
        self.assertIsNotNone(user_auth)
        self.assertTrue(verify_password(initial_pw, user_auth["password_hash"]))

        # 6. Change Password
        new_pw = "brandNewPassword456"
        new_hashed = hash_password(new_pw)
        pw_updated = await update_user_password(user_id, new_hashed)
        self.assertTrue(pw_updated)

        user_auth_after_pw = await get_user_auth_by_id(user_id)
        self.assertTrue(verify_password(new_pw, user_auth_after_pw["password_hash"]))
        self.assertFalse(verify_password(initial_pw, user_auth_after_pw["password_hash"]))

        # 7. Update API Key
        test_key = "gsk_personal_api_key_test"
        key_updated = await update_user_api_key(user_id, test_key)
        self.assertTrue(key_updated)

        user_with_key = await get_user_by_id(user_id)
        self.assertEqual(user_with_key["api_key"], test_key)


if __name__ == "__main__":
    unittest.main()
