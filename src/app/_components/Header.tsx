import Image from "next/image";
import {
  RegisterLink,
  LoginLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { HeaderProps } from "@/types/header";
import { TextProps } from "@/types/common";
export default function Header({ variant = "dark" }: HeaderProps & TextProps) {
  const isDark = variant === "dark";
  return (
    <header className={isDark ? "bg-black" : "bg-white"}>
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Image src={"/logo-1.png"} alt="logo" width={100} height={100} />
        <div
          className={`text-2xl font-bold ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          Clario
        </div>

        <div className="flex flex-1 items-center justify-end md:justify-between pl-45">
          <nav aria-label="Global" className="hidden md:block">
            <ul className="flex items-center gap-6 text-medium">
              <li>
                <a
                  className={`text-medium font-light text-${
                    isDark ? "white" : "black"
                  } transition hover:text-${
                    isDark ? "white" : "black"
                  }/75 sm:block`}
                  href="#"
                >
                  About
                </a>
              </li>

              <li>
                <a
                  className={`text-medium font-light text-${
                    isDark ? "white" : "black"
                  } transition hover:text-${
                    isDark ? "white" : "black"
                  }/75 sm:block`}
                  href="#"
                >
                  Careers
                </a>
              </li>

              <li>
                <a
                  className={`text-medium font-light text-${
                    isDark ? "white" : "black"
                  } transition hover:text-${
                    isDark ? "white" : "black"
                  }/75 sm:block`}
                  href="#"
                >
                  History
                </a>
              </li>

              <li>
                <a
                  className={`text-medium font-light text-${
                    isDark ? "white" : "black"
                  } transition hover:text-${
                    isDark ? "white" : "black"
                  }/75 sm:block`}
                  href="#"
                >
                  Services
                </a>
              </li>

              <li>
                <a
                  className={`text-medium font-light text-${
                    isDark ? "white" : "black"
                  } transition hover:text-${
                    isDark ? "white" : "black"
                  }/75 sm:block`}
                  href="#"
                >
                  Projects
                </a>
              </li>

              <li>
                <a
                  className={`text-medium font-light text-${
                    isDark ? "white" : "black"
                  } transition hover:text-${
                    isDark ? "white" : "black"
                  }/75 sm:block`}
                  href="#"
                >
                  Blog
                </a>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <div className="sm:flex sm:gap-4">
              <div
                //     className="block rounded-md  px-5 py-2.5 text-sm font-medium
                // text-white transition "
                className={`block rounded-md px-5 py-2.5 text-sm font-medium text-${
                  isDark ? "white" : "black"
                } transition hover:text-${
                  isDark ? "white" : "black"
                }/75 sm:block`}
              >
                <LoginLink postLoginRedirectURL="/dashboard"> Login</LoginLink>
              </div>

              <div
                className={`block rounded-md px-5 py-2.5 text-sm font-medium text-${
                  isDark ? "white" : "black"
                } transition hover:text-${
                  isDark ? "white" : "black"
                }/75 sm:block`}
              >
                <RegisterLink>Register</RegisterLink>
              </div>
            </div>

            <button className="block rounded-sm bg-gray-100 p-2.5 text-gray-600 transition hover:text-gray-600/75 md:hidden">
              <span className="sr-only">Toggle menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
