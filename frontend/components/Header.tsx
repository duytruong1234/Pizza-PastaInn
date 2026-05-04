import HeaderClient from './HeaderClient';

export default async function Header() {
  let storeName = 'Pizza&PastaInn';
  try {
    const res = await fetch('http://localhost:4000/api/stores', { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        storeName = json.data[0].store_name || storeName;
      }
    }
  } catch (err) {
    console.error('Failed to fetch store name for logo:', err);
  }

  return (
    <header className="bg-black text-white relative z-50">
      <HeaderClient storeName={storeName} />
    </header>
  );
}
