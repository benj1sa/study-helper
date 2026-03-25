/**
 * Simple mapping table from topic names to PDF base names.
 * Each topic name maps to the base name of the PDF file (without -no-solutions.pdf or -with-solutions.pdf).
 */

const TOPIC_TO_PDF_MAP: Record<string, string> = {
  // Preliminaries
  "preliminaries": "preliminaries",

  // Amortized Analysis
  "amortized analysis of cost (aggregate method)": "amortizedanalysis",
  "amortized analysis of cost (token method)": "amortizedanalysis",

  // Binary Search Trees
  "binary search trees": "binarysearchtrees",

  // AVL Trees
  "avl trees (definition, balance, height bound)": "avltrees",
  "avl trees (rotations, start of insertions)": "avltrees",
  "avl trees (finish insertions, deletion)": "avltrees",

  // B Trees
  "b trees (intro, definition, height theorems)": "btrees",
  "b trees (insertion, rotations, split-and-promote)": "btrees",
  "b trees (deletion, rotations, demote-and-merge)": "btrees",

  // Scapegoat Trees
  "scapegoat trees (balance, informalities, formalities, rebuilding)": "scapegoattrees",
  "scapegoat trees (insert, delete, math proofs)": "scapegoattrees",
  "scapegoat trees (amortized analysis)": "scapegoattrees",

  // Splay Trees
  "splay trees (intro, the splay operation, search)": "splaytrees",
  "splay trees (insertion and deletion methods, time complexity)": "splaytrees",

  // EKD Trees
  "ekd trees (intro, split types, insertion)": "ekdtrees",
  "ekd trees (search, delete, bounding boxes)": "ekdtrees",
  "ekd trees (queries)": "ekdtrees",

  // Skip Lists
  "skip lists (perfect and random skip lists, probabilities)": "skiplists",
  "skip lists (probability proof, expected number of levels proof, search proof)": "skiplists",
  "skip lists (insert, delete, average case with a maximum enforced level)": "skiplists",

  // Hashing
  "hash functions and tables (hash functions, open and closed addressing)": "hashing",
  "hash functions and tables (details of OA/CA, probing, load balancing)": "hashing",
  "hash functions and tables (amortized analysis)": "hashing",

  // Blockchains
  "blockchains (non-distributed, distributed, adding data, cryptocurrencies)": "blockchains",
  "blockchains (merkle trees for transaction verification, market information)": "blockchains",

  // Disjoint Set Data Structures
  "disjoint set data structures (intro, lists, forests, operations version 1)": "disjointsetdatastructures",
  "disjoint set data structures (operations version 2, kruskal's algorithm)": "disjointsetdatastructures",

  // Note: The following topics don't have PDFs available:
  // - compressed tries (character tries, compressed trie for a set of strings)
  // - compressed tries (formal definition, height bounds, search, insert, delete)
  // - treaps (definition, creation from pairs, priority choice methods)
  // - treaps (insertion, deletion)
};

/**
 * Maps a topic name to its corresponding PDF base name.
 * Returns null if no mapping is found.
 */
export function getPdfBaseName(topicName: string): string | null {
  return TOPIC_TO_PDF_MAP[topicName] || null;
}

/**
 * Gets the PDF URL for a topic name and PDF type.
 * Returns null if no PDF is available for the topic.
 */
export function getPdfUrl(topicName: string, withSolutions: boolean = false): string | null {
  const baseName = getPdfBaseName(topicName);
  if (!baseName) {
    return null;
  }

  const suffix = withSolutions ? "with-solutions" : "no-solutions";
  // Use backend endpoint to serve PDFs (same base URL as API)
  const API_BASE_URL = "http://localhost:8000";
  return `${API_BASE_URL}/api/pdf/${baseName}-${suffix}.pdf`;
}
