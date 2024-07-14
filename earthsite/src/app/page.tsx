import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main>
            <button><Link href="/about">about</Link></button><br />
            <button><Link href="/status">status</Link></button><br />
            <button><Link href="/main">main</Link></button>
    </main>
  );
}
