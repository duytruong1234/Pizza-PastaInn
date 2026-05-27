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
    console.error('Lỗi khi lấy tên cửa hàng:', err);
  }

  return (
    <header className="bg-[#121424]/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-white/[0.1] shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
      <HeaderClient storeName={storeName} />
    </header>
  );
}
