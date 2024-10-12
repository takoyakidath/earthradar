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
        <Link href="https://github.com/Takoyaki-neonz-net/EarthRadar">
        <button className={classes.button}>
          github
        </button>
        </Link>
        <br />
            {/*
        <Link href="localhost:4140">
        修正予定
          <button className={classes.button}>Go to Home</button>
        </Link>
        */}
      </main>
      <h1> Copyright © 2024 Takoyaki. All rights reserved.</h1>
    </div>
  );
}
