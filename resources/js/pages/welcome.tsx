import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Database, Shield, Zap, Eye, Cloud, Server, CheckCircle2, Crown } from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Backup Raja - The King of Backups">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                {/* Navigation */}
                <nav className="border-b border-orange-100 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Crown className="h-8 w-8 text-orange-600" />
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Backup <span className="text-orange-600">Raja</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="text-sm font-medium text-gray-700 transition hover:text-orange-600 dark:text-gray-300"
                                        >
                                            Log in
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href={register()}
                                                className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                                            >
                                                Get Started
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                <Crown className="h-4 w-4" />
                                Open Source Backup Management
                            </div>
                            <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl dark:text-white">
                                The <span className="text-orange-600">King</span> of<br />
                                Backup Management
                            </h1>
                            <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600 dark:text-gray-300">
                                Centralized backup orchestration for MongoDB and S3. Monitor, manage, and restore your data with real-time visibility. No command-line required.
                            </p>
                            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-orange-700"
                                    >
                                        <Crown className="h-5 w-5" />
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-orange-700"
                                        >
                                            <Crown className="h-5 w-5" />
                                            Start Free
                                        </Link>
                                        <a
                                            href="https://github.com/yourusername/backup-raja"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition hover:border-orange-600 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        >
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                            </svg>
                                            View on GitHub
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                                Why Backup Raja?
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300">
                                Everything you need to manage backups like royalty
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {/* Feature 1 */}
                            <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                <div className="mb-4 inline-flex rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
                                    <Eye className="h-6 w-6 text-orange-600" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                                    Real-Time Monitoring
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Watch your backups happen in real-time with terminal-like logs. See every step, every file, every collection being backed up.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                <div className="mb-4 inline-flex rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
                                    <Database className="h-6 w-6 text-orange-600" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                                    Multi-Source Support
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Backup MongoDB databases and S3 buckets from a single interface. No switching between tools.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                <div className="mb-4 inline-flex rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
                                    <Cloud className="h-6 w-6 text-orange-600" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                                    Flexible Destinations
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Store backups in S3, Google Drive, or server local storage. Mix and match as needed.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                <div className="mb-4 inline-flex rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
                                    <Zap className="h-6 w-6 text-orange-600" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                                    Queue-Based Processing
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Asynchronous backup execution with Laravel queues. Never block your workflow.
                                </p>
                            </div>

                            {/* Feature 5 */}
                            <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                <div className="mb-4 inline-flex rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
                                    <Shield className="h-6 w-6 text-orange-600" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                                    Secure by Default
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Encrypted credential storage, authentication, CSRF protection, and rate limiting built-in.
                                </p>
                            </div>

                            {/* Feature 6 */}
                            <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                <div className="mb-4 inline-flex rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
                                    <Server className="h-6 w-6 text-orange-600" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                                    One-Click Restore
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Restore backups to original or different destinations with a single click. Full verification included.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tech Stack */}
                <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                                Built with Modern Tech
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300">
                                Laravel 12, React 19, Inertia.js, and TypeScript
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-800">
                                <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Backend</h3>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <CheckCircle2 className="h-5 w-5 text-orange-600" />
                                        Laravel 12 with PHP 8.2+
                                    </li>
                                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <CheckCircle2 className="h-5 w-5 text-orange-600" />
                                        Service-oriented architecture
                                    </li>
                                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <CheckCircle2 className="h-5 w-5 text-orange-600" />
                                        Queue-based async processing
                                    </li>
                                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <CheckCircle2 className="h-5 w-5 text-orange-600" />
                                        Adapter pattern for extensibility
                                    </li>
                                </ul>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-800">
                                <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Frontend</h3>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <CheckCircle2 className="h-5 w-5 text-orange-600" />
                                        React 19 with TypeScript
                                    </li>
                                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <CheckCircle2 className="h-5 w-5 text-orange-600" />
                                        Inertia.js for seamless SPA
                                    </li>
                                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <CheckCircle2 className="h-5 w-5 text-orange-600" />
                                        shadcn/ui components
                                    </li>
                                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <CheckCircle2 className="h-5 w-5 text-orange-600" />
                                        Tailwind CSS 4.0
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl">
                        <div className="rounded-3xl bg-gradient-to-r from-orange-600 to-amber-600 p-12 text-center shadow-2xl">
                            <Crown className="mx-auto mb-6 h-16 w-16 text-white" />
                            <h2 className="mb-4 text-4xl font-bold text-white">
                                Ready to Rule Your Backups?
                            </h2>
                            <p className="mb-8 text-xl text-orange-100">
                                Join the kingdom of worry-free backup management
                            </p>
                            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-semibold text-orange-600 transition hover:bg-gray-100"
                                    >
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-semibold text-orange-600 transition hover:bg-gray-100"
                                        >
                                            Get Started Free
                                        </Link>
                                        <a
                                            href="https://github.com/yourusername/backup-raja"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white transition hover:bg-white hover:text-orange-600"
                                        >
                                            Star on GitHub
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-gray-200 bg-white px-4 py-12 dark:border-gray-800 dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                            <div className="flex items-center gap-3">
                                <Crown className="h-6 w-6 text-orange-600" />
                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                    Backup <span className="text-orange-600">Raja</span>
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Open source backup management. Built with ❤️ using Laravel & React.
                            </p>
                            <div className="flex items-center gap-6">
                                <a
                                    href="https://github.com/yourusername/backup-raja"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 transition hover:text-orange-600 dark:text-gray-400"
                                >
                                    GitHub
                                </a>
                                <a
                                    href="https://github.com/yourusername/backup-raja/blob/main/README.md"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 transition hover:text-orange-600 dark:text-gray-400"
                                >
                                    Documentation
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
