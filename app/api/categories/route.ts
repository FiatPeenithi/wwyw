import { NextResponse } from "next/server";
import { fetchCategories } from "../../lib/sheets";


export async function GET() {
try {
const categories = await fetchCategories();
return NextResponse.json({ categories });
} catch (err) {
console.error(err);
return NextResponse.json(err, { status: 500 });
}
}