import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from "@tanstack/react-router";
import { PenIcon } from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { CropperProps, Area } from "react-easy-crop";

import NavBar from "../../../components/NavBar-test";
import { User } from "../../../types/auth";
import { fetchWithAuth } from "../../../utils/api";
import { getCroppedCircularImage } from "../../../utils/cropImage";

interface EditResponse {
  status?: string;
  message: string;
  user: User;
}

// Cast to bypass the class component type mismatch
const EasyCropper = Cropper as unknown as React.FC<
  Partial<CropperProps> & {
    image: string;
    crop: CropperProps["crop"];
    onCropChange: CropperProps["onCropChange"];
  }
>;

export const Route = createFileRoute("/_auth/profile/edit")({
  loader: async () => {
    type ProfileResponse = {
      user: User;
    };

    try {
      const data = await fetchWithAuth<ProfileResponse>("/profile");
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const profile = useLoaderData({ from: "/_auth/profile/edit" });

  const navigate = useNavigate();
  const isOauthUser = profile?.user.oauth_provider ? true : false;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProfilePicChanged, setIsProfilePicChanged] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(profile?.user.profile_pic || "");

  // form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [error, setError] = useState("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageEditClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const onSelectFile = (e: ChangeEvent<HTMLInputElement>) => {
    console.log("hi2");

    const file = e.target.files?.[0];
    console.log(file);
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const imageUrl = reader.result?.toString() || "";
      console.log({ imageUrl });
      setImageSrc(imageUrl);
      setModalOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    const croppedImage = await getCroppedCircularImage(
      imageSrc,
      croppedAreaPixels,
    );

    setImageSrc(croppedImage); // preview
    setIsProfilePicChanged(true);
    setModalOpen(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log({ name, value });
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isOauthUser) {
      if (formData.newPassword && !formData.password) {
        setError("Please enter you current password to set a new one.");
        return;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        setError("New passwords do not match.");
        return;
      }
    }

    try {
      const body = new FormData();

      if (formData.name.trim() && formData.name !== profile?.user.name) {
        body.append("name", formData.name);
      }

      // Email + password: only for non-OAuth users
      if (!isOauthUser) {
        if (formData.email.trim() && formData.email !== profile?.user.email) {
          body.append("email", formData.email);
        }
        if (formData.password) {
          body.append("password", formData.password);
        }
        if (formData.newPassword) {
          body.append("new_password", formData.newPassword);
        }
      }
      // profile pic

      if (isProfilePicChanged) {
        // convert base64 data url -> blob -> file
        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const file = new File([blob], "avatar.png", { type: blob.type });
        body.append("profile_pic", file);
        // console.log(file);
      }

      // ✅ Actually shows the entries
      console.log([...body.entries()]);
      const data = await fetchWithAuth<EditResponse>("/profile", {
        method: "PATCH",
        body,
      });

      console.log({ data });

      if (data.status === "email_verification_required") {
        console.log("yes no 123");

        navigate({ to: "/profile/verify-email" });
        return;
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      setError("Something went wrong. Please try again.");
    }
    navigate({ to: "/profile" });
  };

  const isFormDirty =
    (formData.name.trim() !== "" && formData.name !== profile?.user.name) ||
    (formData.email.trim() !== "" && formData.email !== profile?.user.email) ||
    formData.password !== "" ||
    formData.newPassword !== "" ||
    formData.confirmNewPassword !== "" ||
    isProfilePicChanged;

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />

        <div className="container mx-auto flex flex-col justify-center bg-red-50 px-4 py-24">
          <div className="bg-purple-70 m-5 flex justify-center p-4">
            <div className="bg-red-40 relative inline-block">
              <img
                src={imageSrc}
                alt="avatar"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-purple-500"
              />
              <button
                className="absolute -right-1 -bottom-1 cursor-pointer items-center justify-center rounded-full bg-amber-300 p-1 shadow-md"
                onClick={handleImageEditClick}
              >
                <PenIcon />
              </button>
              <input
                type="file"
                id="avatar"
                name="avatar"
                ref={imageInputRef}
                style={{ display: "none" }}
                onChange={onSelectFile}
              ></input>
            </div>
          </div>

          {/*  */}
          <div className="flex bg-amber-50 p-3">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  onChange={handleChange}
                  placeholder={profile?.user.name}
                  value={formData.name}
                />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  onChange={handleChange}
                  value={formData.email}
                  placeholder={profile?.user.email}
                  disabled={isOauthUser}
                />
              </div>
              {!isOauthUser && (
                <>
                  <div>
                    <label htmlFor="name">Password</label>
                    <input
                      type="text"
                      id="password"
                      value={formData.password}
                      name="password"
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="name">New Password</label>
                    <input
                      type="text"
                      id="newPassword"
                      value={formData.newPassword}
                      name="newPassword"
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="name">Confirm New Password</label>
                    <input
                      type="text"
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      value={formData.confirmNewPassword}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
              {/* action buttons*/}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-center-safe gap-3">
                <button
                  className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => navigate({ to: "/profile" })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 disabled:bg-gray-500"
                  // onClick={(handleSubmit)}
                  disabled={!isFormDirty}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/*  */}
      {/* modal backdrop */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          {/* modal box */}
          <div className="relative flex w-[90vw] max-w-lg flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            {/* header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Crop Image
              </h2>
              <button
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* cropper area */}
            <div className="relative h-80 w-full overflow-hidden rounded-lg bg-gray-100">
              <EasyCropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* zoom slider */}
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-purple-600"
            />

            {/* actions */}
            <div className="flex justify-end gap-3">
              <button
                className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
                onClick={handleCropConfirm}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
