"use client";
import { Footer } from "@/components/Footer";
import { Reception } from "@/components/Reception";
import Link from "next/link";
import classes from "@/components/classes.module.css";

export default function Home() {
  return (
    <div>
      <main>
        <Reception />
        <br />
        <Link href="/">
          <button className={classes.button}>Go to Home</button>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
