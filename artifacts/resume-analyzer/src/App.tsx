import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAnalyzeResume } from '@workspace/api-client-react';
import {
  ArrowDown, ArrowRight, BriefcaseBusiness, Check, ClipboardCheck,
  FileText, Lightbulb, LoaderCircle, RotateCcw, Sparkles, Target,
  TriangleAlert, Upload, X,
} from 'lucide-react';

const queryClient = new QueryClient();

const SAMPLE_RESUME = `Product designer with 5+ years of experience turning complex workflows into clear, useful products. Led end-to-end design for B2B SaaS platforms used by 40,000+ customers.

Experience
Senior Product Designer, Nook Systems (2021–Present)
Product Designer, Fieldwork Labs (2019–2021)

Skills
Figma, user research, prototyping, design systems, usability testing, workshop facilitation, HTML/CSS`;

const SAMPLE_JOB = `We are looking for a Senior Product Designer to shape the next generation of collaborative tools. You will partner with product and engineering to define problems, prototype ideas, and ship thoughtful experiences.

You have 5+ years of product design experience, a strong portfolio, and deep fluency in Figma. Experience building design systems, running user research, and working in an agile environment is important. Familiarity with accessibility standards and analytics is a plus.`;

type Analysis = {
  match_score: number;
  strengths: string[];
  missing_skills: string[];
  improvement_suggestions: string[];
  interview_questions: string[];
};

function ResultList({ items, tone, icon: Icon, testId }: { items: string[]; tone: 'teal' | 'coral' | 'gold'; icon: typeof Check; testId: string }) {
  const tones = { teal: 'bg-[#e0f0eb] text-[#0a5f5c]', coral: 'bg-[#fae4dc] text-[#a84c38]', gold: 'bg-[#f4ecd4] text-[#816521]' };
  return (
    <ul className="space-y-3" data-testid={testId}>
      {items.length ? items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 text-[15px] leading-6 text-[#31504e]">
          <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}><Icon size={13} strokeWidth={2.5} /></span>
          <span>{item}</span>
        </li>
      )) : <li className="text-sm italic text-[#71817e]">Nothing was flagged here.</li>}
    </ul>
  );
}

function ScoreRing({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score));
  const offset = 283 - (283 * safeScore) / 100;
  return (
    <div className="relative size-[178px] shrink-0" data-testid="result-match-score">
      <svg className="size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(38 23% 88%)" strokeWidth="6" />
        <circle className="score-draw" cx="50" cy="50" r="45" fill="none" stroke="hsl(174 75% 27%)" strokeLinecap="round" strokeWidth="6" strokeDasharray="283" strokeDashoffset={offset} style={{ '--score-offset': offset } as CSSProperties} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[53px] leading-none text-[#124f4c]" data-testid="text-match-score">{Math.round(safeScore)}</span>
        <span className="mt-1 font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#71817e]">match score</span>
      </div>
    </div>
  );
}

function LoadingResult() {
  return (
    <section className="mt-14 border-t border-[#dcd8ce] pt-10" aria-live="polite" data-testid="loading-state">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-[#dcece7] text-[#0a5f5c]"><LoaderCircle className="animate-spin" size={18} /></span>
        <div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#0a5f5c]">analyzing your fit</p><p className="mt-1 text-sm text-[#71817e]">Reading your experience against the role.</p></div>
      </div>
      <div className="grid gap-5 md:grid-cols-[.8fr_1.2fr]"><div className="h-[210px] animate-pulse rounded-[22px] bg-[#e8e6dc]" /><div className="space-y-4 rounded-[22px] border border-[#e4e0d6] bg-[#fffdf8] p-6"><div className="h-4 w-1/3 animate-pulse rounded bg-[#e8e6dc]" /><div className="h-8 w-4/5 animate-pulse rounded bg-[#e8e6dc]" /><div className="h-3 w-full animate-pulse rounded bg-[#e8e6dc]" /><div className="h-3 w-11/12 animate-pulse rounded bg-[#e8e6dc]" /></div></div>
    </section>
  );
}

function AnalysisResult({ result }: { result: Analysis }) {
  const questions = result.interview_questions.slice(0, 5);
  const scoreMessage = result.match_score >= 75 ? 'You have a credible story here.' : result.match_score >= 50 ? 'There is a solid starting point to sharpen.' : 'A few focused changes can shift the story.';
  return (
    <section className="mt-14 border-t border-[#dcd8ce] pt-10" aria-live="polite" data-testid="analysis-result">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#0a5f5c]">your readout</p><h2 className="mt-2 font-display text-[42px] leading-[.95] text-[#124f4c] md:text-[56px]">A clearer next step.</h2></div><p className="max-w-[260px] text-sm leading-5 text-[#71817e] sm:text-right">A practical read of where your experience meets the role.</p></div>
      <div className="soft-shadow overflow-hidden rounded-[26px] border border-[#d8e3dc] bg-[#f1f7f3]"><div className="flex flex-col items-center gap-8 p-6 md:flex-row md:p-8"><ScoreRing score={result.match_score} /><div className="max-w-xl"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#71817e]">the headline</p><h3 className="mt-2 text-[26px] font-semibold leading-tight text-[#174f4c]">{scoreMessage}</h3><p className="mt-3 text-[15px] leading-6 text-[#4e6a66]">The score is a directional signal. The useful part is knowing exactly what to bring forward, fill in, and ask about next.</p></div><div className="ml-auto hidden shrink-0 self-start rounded-full border border-[#c7dcd2] px-3 py-1.5 font-mono-ui text-[10px] uppercase tracking-[.12em] text-[#39726b] md:block">analysis complete</div></div></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="soft-shadow rounded-[22px] border border-[#dfd9cc] bg-[#fffdf8] p-6 md:p-7" data-testid="card-strengths"><div className="mb-5 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#e0f0eb] text-[#0a5f5c]"><Check size={17} /></span><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#778581]">keep leading with</p><h3 className="text-xl font-semibold text-[#193c3a]">Your strengths</h3></div></div><ResultList items={result.strengths} tone="teal" icon={Check} testId="strengths-list" /></div>
        <div className="soft-shadow rounded-[22px] border border-[#ead9d0] bg-[#fffaf6] p-6 md:p-7" data-testid="card-missing-skills"><div className="mb-5 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#fae4dc] text-[#a84c38]"><TriangleAlert size={17} /></span><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#a86b5b]">worth addressing</p><h3 className="text-xl font-semibold text-[#59372f]">Missing skills</h3></div></div><ResultList items={result.missing_skills} tone="coral" icon={TriangleAlert} testId="missing-skills-list" /></div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="soft-shadow rounded-[22px] border border-[#dfd9cc] bg-[#fffdf8] p-6 md:p-7" data-testid="card-suggestions"><div className="mb-5 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#f4ecd4] text-[#816521]"><Lightbulb size={17} /></span><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#89764a]">make it sharper</p><h3 className="text-xl font-semibold text-[#193c3a]">Improvement suggestions</h3></div></div><ResultList items={result.improvement_suggestions} tone="gold" icon={ArrowRight} testId="suggestions-list" /></div>
        <div className="soft-shadow rounded-[22px] border border-[#d8e3dc] bg-[#f1f7f3] p-6 md:p-7" data-testid="card-interview-questions"><div className="mb-5 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#dcece7] text-[#0a5f5c]"><ClipboardCheck size={17} /></span><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#39726b]">practice these</p><h3 className="text-xl font-semibold text-[#174f4c]">Interview questions</h3></div></div><ol className="space-y-4" data-testid="interview-questions-list">{questions.map((question, index) => <li key={`${question}-${index}`} className="flex gap-3 border-b border-[#d7e6df] pb-3 text-[14px] leading-5 text-[#31504e] last:border-0 last:pb-0"><span className="font-mono-ui text-[11px] text-[#8aac9f]">{String(index + 1).padStart(2, '0')}</span><span>{question}</span></li>)}</ol></div>
      </div>
    </section>
  );
}

function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [sampleResume, setSampleResume] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const analyze = useAnalyzeResume();
  const isBusy = isUploading || analyze.isPending;
  const canAnalyze = (Boolean(file) || sampleResume.length >= 40) && jobDescription.trim().length >= 40;
  const uploadError = analyze.error instanceof Error ? analyze.error.message : '';

  const chooseFile = (nextFile: File | undefined) => {
    setError('');
    setResult(null);
    analyze.reset();
    if (!nextFile) return;
    const valid = nextFile.name.toLowerCase().endsWith('.pdf') || nextFile.name.toLowerCase().endsWith('.docx');
    if (!valid) { setFile(null); setError('Unsupported file type. Please choose a PDF or DOCX resume.'); return; }
    if (nextFile.size === 0) { setFile(null); setError('That file is empty. Please choose a resume with readable text.'); return; }
    setSampleResume('');
    setFile(nextFile);
  };

  const submit = async () => {
    if (!canAnalyze || isBusy) return;
    setError('');
    setResult(null);
    if (sampleResume) {
      analyze.mutate({ data: { resume: sampleResume, jobDescription: jobDescription.trim() } }, { onSuccess: (data) => setResult(data as Analysis) });
      return;
    }
    if (!file) return;
    setIsUploading(true);
    const body = new FormData();
    body.append('resume', file);
    body.append('jobDescription', jobDescription.trim());
    try {
      const response = await fetch('/api/analyze/upload', { method: 'POST', body });
      const data = await response.json() as Analysis & { error?: string };
      if (!response.ok) throw new Error(data.error || 'The analysis could not be completed.');
      setResult(data);
    } catch (uploadFailure) {
      setError(uploadFailure instanceof Error ? uploadFailure.message : 'The analysis could not be completed.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => { setFile(null); setSampleResume(''); setJobDescription(''); setResult(null); setError(''); analyze.reset(); if (fileInput.current) fileInput.current.value = ''; };
  const useSample = () => { setFile(null); setSampleResume(SAMPLE_RESUME); setJobDescription(SAMPLE_JOB); setResult(null); setError(''); analyze.reset(); };
  const shownError = error || (analyze.isError ? uploadError : '');

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f7f3ea]">
      <header className="mx-auto flex max-w-[1220px] items-center justify-between px-5 py-6 md:px-10 md:py-8"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#0a5f5c] text-[#f7f3ea]"><Sparkles size={17} /></span><span className="text-[17px] font-semibold tracking-[-.03em] text-[#124f4c]">Minahil — AI Resume Analyzer</span><span className="hidden h-4 w-px bg-[#d7d0c3] sm:block" /><span className="hidden font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#778581] sm:block">AI resume analyzer</span></div><div className="flex items-center gap-3"><span className="hidden font-mono-ui text-[10px] uppercase tracking-[.12em] text-[#778581] sm:block">private by default</span><span className="size-2 rounded-full bg-[#ed967f] ring-4 ring-[#f8e5dc]" /></div></header>
      <div className="mx-auto max-w-[1220px] px-5 pb-20 md:px-10 md:pb-28">
        <section className="relative grid gap-12 pb-14 pt-9 md:grid-cols-[1.15fr_.85fr] md:items-end md:gap-20 md:pb-20 md:pt-16"><div className="relative z-10 rise-in"><p className="mb-5 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#0a5f5c]"><span className="h-px w-8 bg-[#0a5f5c]" /> a more useful read</p><h1 className="max-w-[720px] text-balance text-[56px] font-semibold leading-[.93] tracking-[-.06em] text-[#124f4c] md:text-[88px]">Know what to say <span className="font-display font-normal italic text-[#d66f55]">next.</span></h1><p className="mt-7 max-w-[480px] text-[17px] leading-7 text-[#5e706c] md:text-[18px]">AI-powered Resume &amp; Job Match Tool. Upload your resume, compare it to one specific role, and leave with a sharper story.</p></div><div className="rise-in-delay relative md:pb-2"><div className="absolute -left-9 -top-12 size-36 rounded-full border border-[#e2d9c8] md:size-48" /><div className="relative rounded-[24px] border border-[#dfd9cc] bg-[#fffaf0] p-6 md:p-7"><div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#778581]">the approach</span><Target size={17} className="text-[#d66f55]" /></div><div className="mt-7 space-y-5">{['Upload your story', 'Find the overlap', 'Shape your answer'].map((step, index) => <div className="flex items-center gap-4" key={step}><span className={`flex size-8 items-center justify-center rounded-full font-mono-ui text-[11px] ${index === 2 ? 'bg-[#0a5f5c] text-[#f7f3ea]' : 'border border-[#d8d0c1] text-[#778581]'}`}>{String(index + 1).padStart(2, '0')}</span><span className={`text-[15px] ${index === 2 ? 'font-semibold text-[#124f4c]' : 'text-[#71817e]'}`}>{step}</span>{index === 2 && <Check size={15} className="ml-auto text-[#0a5f5c]" />}</div>)}</div><div className="mt-7 border-t border-[#e8e1d4] pt-4 text-[13px] italic leading-5 text-[#71817e]">“Clarity is a competitive advantage.”</div></div></div></section>
        <section className="rise-in-late scroll-mt-8" id="analyze"><div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#0a5f5c]">01 / add your context</p><h2 className="mt-2 text-[27px] font-semibold tracking-[-.03em] text-[#193c3a] md:text-[32px]">Two sides of the same opportunity.</h2></div><button type="button" onClick={useSample} className="group flex items-center gap-2 self-start text-sm font-semibold text-[#0a5f5c] hover:text-[#d66f55] sm:self-auto" data-testid="button-use-sample">Try a sample <ArrowDown size={15} /></button></div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="textarea-shell soft-shadow rounded-[22px] border border-[#dfd9cc] bg-[#fffdf8] p-5 md:p-6"><div className="mb-4 flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#e4efeb] text-[#0a5f5c]"><FileText size={18} /></span><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#778581]">the experience you bring</p><h3 className="mt-1 text-[17px] font-semibold text-[#193c3a]">Resume upload</h3></div></div><span className="rounded-full bg-[#f1eee5] px-2.5 py-1 font-mono-ui text-[10px] text-[#778581]">PDF / DOCX</span></div><button type="button" onClick={() => fileInput.current?.click()} className="group flex min-h-[190px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#cddbd4] bg-[#f6faf7] px-5 text-center transition hover:border-[#0a5f5c] hover:bg-[#eef7f2]" data-testid="button-upload-resume"><input ref={fileInput} className="hidden" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => chooseFile(event.target.files?.[0])} /><span className="flex size-12 items-center justify-center rounded-full bg-[#dcece7] text-[#0a5f5c] transition group-hover:scale-105"><Upload size={20} /></span>{file ? <><span className="mt-3 max-w-full truncate text-sm font-semibold text-[#174f4c]">{file.name}</span><span className="mt-1 text-xs text-[#71817e]">Click to replace</span></> : sampleResume ? <><span className="mt-3 text-sm font-semibold text-[#174f4c]">Sample resume loaded</span><span className="mt-1 text-xs text-[#71817e]">Use “Try a sample” to replace it</span></> : <><span className="mt-3 text-sm font-semibold text-[#174f4c]">Choose your resume</span><span className="mt-1 text-xs text-[#71817e]">Upload a PDF or DOCX, up to 5 MB</span></>}</button></div>
            <div className="textarea-shell soft-shadow rounded-[22px] border border-[#dfd9cc] bg-[#fffdf8] p-5 md:p-6"><div className="mb-4 flex items-start gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#e4efeb] text-[#0a5f5c]"><BriefcaseBusiness size={18} /></span><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#778581]">the role you want</p><label htmlFor="job-description" className="mt-1 block text-[17px] font-semibold text-[#193c3a]">Job description</label></div></div><textarea id="job-description" data-testid="textarea-job-description" value={jobDescription} onChange={(event) => { setJobDescription(event.target.value); setError(''); }} placeholder="Paste the job description here…" className="min-h-[190px] w-full resize-y border-0 bg-transparent text-[15px] leading-6 text-[#31504e] outline-none placeholder:text-[#a5adaa] md:min-h-[235px]" /><div className="mt-3 flex items-center justify-between border-t border-[#eee9df] pt-3 font-mono-ui text-[10px] uppercase tracking-[.12em] text-[#8b9894]"><span>{jobDescription.length.toLocaleString()} characters</span><span>{jobDescription.length >= 40 ? 'Ready to compare' : `${40 - jobDescription.length} more needed`}</span></div></div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-2 text-[12px] leading-5 text-[#778581]"><span className="mt-0.5 text-[#0a5f5c]"><TriangleAlert size={14} /></span><span>Your resume is used only for this analysis and is not saved.</span></div><div className="flex items-center gap-3">{(file || sampleResume || jobDescription) && <button type="button" onClick={clearAll} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#71817e] hover:bg-[#ece7dc]" data-testid="button-clear-all"><X size={15} /> Clear</button>}<button type="button" onClick={submit} disabled={!canAnalyze || isBusy} data-testid="button-analyze-resume" className="button-shadow group flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#0a5f5c] px-6 text-[15px] font-semibold text-[#f7f3ea] hover:bg-[#074a47] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:min-w-[190px]">{isBusy ? <><LoaderCircle size={17} className="animate-spin" /> Analyzing…</> : <>Analyze resume <ArrowRight size={17} /></>}</button></div></div>
          {shownError && <div className="mt-8 flex flex-col gap-4 rounded-[20px] border border-[#e7c9bd] bg-[#fff5f0] p-5 sm:flex-row sm:items-center sm:justify-between" role="alert" data-testid="error-state"><div className="flex gap-3"><TriangleAlert className="mt-0.5 shrink-0 text-[#b75d45]" size={19} /><div><p className="font-semibold text-[#713e32]">That comparison did not come through.</p><p className="mt-1 text-sm text-[#9a6557]">{shownError}</p></div></div><button type="button" onClick={submit} className="flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#dcae9e] px-4 py-2 text-sm font-semibold text-[#9a4e3c]" data-testid="button-retry-analysis"><RotateCcw size={14} /> Try again</button></div>}
          {isBusy && <LoadingResult />}{result && !isBusy && <AnalysisResult result={result} />}{!result && !isBusy && !shownError && <div className="mt-14 flex flex-col items-center border-t border-[#dcd8ce] px-4 pt-12 text-center" data-testid="empty-state"><div className="flex size-14 items-center justify-center rounded-2xl border border-[#d5e3dc] bg-[#e7f1ed] text-[#0a5f5c]"><Sparkles size={23} /></div><p className="mt-5 font-display text-[29px] text-[#124f4c]">Your next move starts here.</p><p className="mt-2 max-w-[360px] text-sm leading-6 text-[#778581]">Upload your resume and add a role. We’ll turn the comparison into a short, useful conversation guide.</p></div>}
        </section>
      </div>
      <footer className="border-t border-[#dfd9cc]"><div className="mx-auto flex max-w-[1220px] flex-col gap-2 px-5 py-6 font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#8b9894] sm:flex-row sm:items-center sm:justify-between md:px-10"><span>Built by Minahil / made for the moment before you apply</span><span>no accounts · no saved resumes</span></div></footer>
    </main>
  );
}

function App() {
  return <QueryClientProvider client={queryClient}><Home /></QueryClientProvider>;
}

export default App;