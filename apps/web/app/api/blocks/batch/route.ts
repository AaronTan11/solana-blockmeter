import { NextRequest, NextResponse } from "next/server";
import { fetchFromApi } from "@/lib/server-api";

interface BatchRequest {
	blockNumbers: (string | number)[];
}

interface BlockData {
	blockNumber: number;
	success: boolean;
	data?: unknown;
	error?: string;
}

interface BatchResponse {
	results: BlockData[];
}

export async function POST(request: NextRequest) {
	try {
		const body: BatchRequest = await request.json();

		if (!body.blockNumbers || !Array.isArray(body.blockNumbers)) {
			return NextResponse.json(
				{ error: "blockNumbers array is required" },
				{ status: 400 }
			);
		}

		if (body.blockNumbers.length > 10) {
			return NextResponse.json(
				{ error: "Maximum 10 blocks per batch request" },
				{ status: 400 }
			);
		}

		// Process all block requests in parallel
		const results = await Promise.allSettled(
			body.blockNumbers.map(async (blockNumber) => {
				const blockNum = parseInt(blockNumber.toString());

				if (isNaN(blockNum) || blockNum < 0) {
					throw new Error("Invalid block number");
				}

				const data = await fetchFromApi(`/blocks/${blockNumber}`);
				return { blockNumber: blockNum, success: true, data };
			})
		);

		// Map results to response format
		const response: BatchResponse = {
			results: results.map((result, index) => {
				const blockNumber = parseInt(
					body.blockNumbers[index].toString()
				);

				if (result.status === "fulfilled") {
					return result.value;
				} else {
					return {
						blockNumber,
						success: false,
						error: result.reason?.message || "Unknown error",
					};
				}
			}),
		};

		return NextResponse.json(response);
	} catch (error: unknown) {
		console.error("Batch API error:", error);

		return NextResponse.json(
			{ error: "Failed to process batch request" },
			{ status: 500 }
		);
	}
}
