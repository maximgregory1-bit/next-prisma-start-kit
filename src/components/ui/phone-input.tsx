"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { AsYouType, type CountryCode, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js";

type PhoneCountry = {
    name: string;
    iso: CountryCode;
    code: string;
};

const regionNames = typeof Intl !== "undefined" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

const PHONE_COUNTRIES: PhoneCountry[] = getCountries()
    .map((iso) => ({
        iso,
        code: `+${getCountryCallingCode(iso)}`,
        name: regionNames?.of(iso) ?? iso,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

type PhoneInputProps = {
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
};

function getDefaultCountryIso(value?: string): CountryCode {
    if (!value) return "US";
    const parsed = parsePhoneNumberFromString(value);
    if (parsed?.country) {
        return parsed.country;
    }
    const extracted = value.trim().match(/^(\+\d{1,4})\s*/)?.[1];
    if (extracted) {
        const match = PHONE_COUNTRIES.find((country) => country.code === extracted);
        if (match) return match.iso;
    }
    return "US";
}

function splitPhone(value?: string) {
    if (!value) return { iso: "US" as CountryCode, number: "" };

    const parsed = parsePhoneNumberFromString(value);
    if (parsed) {
        return { iso: parsed.country ?? ("US" as CountryCode), number: parsed.formatNational() };
    }

    const m = value.trim().match(/^(\+\d{1,4})\s*(.*)$/);
    if (m) {
        const match = PHONE_COUNTRIES.find((country) => country.code === m[1]);
        if (match) return { iso: match.iso, number: m[2] };
    }

    return { iso: "US" as CountryCode, number: value };
}

export default function PhoneInput({ value, onChange, disabled, className }: PhoneInputProps) {
    const parsed = React.useMemo(() => splitPhone(value), [value]);
    const [countryIso, setCountryIso] = React.useState<CountryCode>(getDefaultCountryIso(value));
    const [number, setNumber] = React.useState(parsed.number);
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        setCountryIso(parsed.iso);
        setNumber(parsed.number);
    }, [parsed.iso, parsed.number]);

    React.useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, []);

    const selectedCountry = React.useMemo(() => PHONE_COUNTRIES.find((country) => country.iso === countryIso) ?? PHONE_COUNTRIES[0], [countryIso]);

    const filteredCountries = React.useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return PHONE_COUNTRIES;
        return PHONE_COUNTRIES.filter((country) => country.name.toLowerCase().includes(term) || country.code.includes(term) || country.iso.toLowerCase().includes(term));
    }, [search]);

    const emit = React.useCallback(
        (iso: CountryCode, nextNumber: string) => {
            const code = PHONE_COUNTRIES.find((country) => country.iso === iso)?.code ?? "+1";
            onChange?.(`${code} ${nextNumber}`.trim());
        },
        [onChange],
    );

    const onCountrySelect = (iso: CountryCode) => {
        setCountryIso(iso);
        emit(iso, number);
        setOpen(false);
        setSearch("");
    };

    const onNumberChange = (raw: string) => {
        try {
            const formatter = new AsYouType(countryIso);
            const formatted = formatter.input(raw);
            setNumber(formatted);
            emit(countryIso, formatted);
            return;
        } catch {
            // fallback to raw text
        }
        setNumber(raw);
        emit(countryIso, raw);
    };

    return (
        <div ref={containerRef} className={className}>
            <div className="flex items-center overflow-visible rounded-sm border border-input bg-background">
                <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    className="inline-flex h-9 items-center gap-2 border-r border-input px-2 text-sm"
                    onClick={() => setOpen((prev) => !prev)}
                    disabled={disabled}
                >
                    <img src={`https://flagcdn.com/w20/${selectedCountry.iso.toLowerCase()}.png`} alt={selectedCountry.name} className="h-3.5 w-5 rounded-[1px] object-cover" />
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none" aria-hidden>
                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <div className="px-2 text-sm text-foreground">{selectedCountry.code}</div>

                <Input
                    className="h-9 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                    placeholder="(850) 323-2656"
                    value={number}
                    onChange={(event) => onNumberChange(event.target.value)}
                    disabled={disabled}
                />
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-sm border border-input bg-background p-2 shadow-md">
                    <div className="mb-2 flex items-center gap-2 rounded-sm border border-input bg-background px-2">
                        <span aria-hidden className="text-muted-foreground">
                            🔎
                        </span>
                        <input
                            autoFocus
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="search"
                            className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>

                    <ul role="listbox" className="max-h-52 overflow-auto">
                        {filteredCountries.map((country) => (
                            <li key={`${country.iso}-${country.code}`}>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                                    onClick={() => onCountrySelect(country.iso)}
                                >
                                    <img src={`https://flagcdn.com/w20/${country.iso.toLowerCase()}.png`} alt={country.name} className="h-3.5 w-5 rounded-[1px] object-cover" />
                                    <span className="flex-1">{country.name}</span>
                                    <span className="text-muted-foreground">{country.code}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
