"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

const links = [
  { name: "Home", href: "/dashboard", icon: HomeIcon },
  { name: "Invoices", href: "/dashboard/invoices", icon: DocumentDuplicateIcon },
  { name: "Customers", href: "/dashboard/customers", icon: UserGroupIcon },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive =
          pathname === link.href || pathname.startsWith(link.href + "/");

        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              "flex h-[48px] items-center gap-2 rounded-md bg-gray-50 p-3 text-base font-medium hover:bg-sky-100 hover:text-blue-600",
              { "bg-sky-100 text-blue-600": isActive }
            )}
          >
            <Icon className="w-6" />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </>
  );
}