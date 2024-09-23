"use client";
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
      <h1> Copyright © 2024 Takoyaki. All rights reserved.</h1>
    </div>
  );
}
