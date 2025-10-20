"use client";
import { PackageIcon, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import Image from "next/image";
import { assets } from "@/assets/assets";
import { useClerk, UserButton, useUser } from "@clerk/nextjs";
import { authSeller } from "@/middlewares/authSeller";
import { useEffect } from "react";

const Navbar = () => {
  const router = useRouter();

  const { user } = useUser();
  const { openSignIn } = useClerk();

  const [isSeller, setIsSeller] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkSellerStatus = async () => {
      try {
        const response = await fetch('/api/store/is-seller');
        const data = await response.json();
        setIsSeller(data.isSeller);
      } catch (error) {
        console.error('Error checking seller status:', error);
        setIsSeller(false);
      }
    };

    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/is-admin');
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    if (user) {
      checkSellerStatus();
      checkAdminStatus()
    }
  }, [user, isSeller, isAdmin]);

  const [search, setSearch] = useState("");
  const cartCount = useSelector((state) => state.cart.total);

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/shop?search=${search}`);
  };

  return (
    <nav className="relative bg-white">
      <div className="mx-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto py-4  transition-all">
          <Link href="/" className="relative flex items-center">
            <Image
              src={assets.logo}
              alt="Logo"
              className="h-14 w-auto"
              height={60}
              width={120}
              priority
            />
            {/* <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                            plus
                        </p> */}
          </Link>

          {/* Desktop Menu */}
          <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
            <Link href="/">Home</Link>
            <Link href="/shop">Shop</Link>
            { isSeller ? <Link href="/store">Store</Link> : null}

            <form
              onSubmit={handleSearch}
              className="hidden xl:flex items-center w-xs text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full"
            >
              <Search size={18} className="text-slate-600" />
              <input
                className="w-full bg-transparent outline-none placeholder-slate-600"
                type="text"
                placeholder="Search products"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                required
              />
            </form>

            <Link
              href="/cart"
              className="relative flex items-center gap-2 text-slate-600"
            >
              <ShoppingCart size={18} />
              Cart
              <button className="absolute -top-1 left-3 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">
                {cartCount}
              </button>
            </Link>

            {!user ? (
              <button
                onClick={openSignIn}
                className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full"
              >
                Login
              </button>
            ) : (
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="My Orders"
                    onClick={() => router.push("/orders")}
                    labelIcon={<PackageIcon size={16} />}
                  />
                  {isAdmin && (
                     <UserButton.Action
                    label="Dashboard"
                    onClick={() => router.push("/admin")}
                    labelIcon={<PackageIcon size={16} />}
                  />)}
                </UserButton.MenuItems>
              </UserButton>
            )}
          </div>

          {/* Mobile User Button  */}
          <div className="sm:hidden">
            {user ? (
              <div className="flex gap-2">
                {/* Desktop / Mobile unified approach */}
                <UserButton>
                  <UserButton.MenuItems>
                    <UserButton.Action
                      label="Cart"
                      onClick={() => router.push("/cart")}
                      labelIcon={<ShoppingCart size={16} />}
                    />
                    <UserButton.Action
                      label="My Orders"
                      onClick={() => router.push("/orders")}
                      labelIcon={<PackageIcon size={16} />}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            ) : (
              <button
                onClick={openSignIn}
                className="px-7 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-sm transition text-white rounded-full"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
      <hr className="border-gray-300" />
    </nav>
  );
};

export default Navbar;
