import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSearchOpen } from '../../store/slices/uiSlice';
import { Search, X, Mic, MicOff, Flame, Sparkles } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const TRENDING_SEARCHES = ['Tambulam Bags', 'Brass Bowls', 'Bridal Hampers', 'Mehendi Favors', 'Silver Gifts'];
const AI_SUGGESTIONS = [
  'Show wedding return gifts under ₹299',
  'Curated baby shower hamper boxes',
  'Luxury corporate gifts with customized branding'
];

export const SearchModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isSearchOpen);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Autocomplete Suggestion search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await apiRequest(`/products/search?q=${encodeURIComponent(query)}`);
          if (res.success) {
            setResults(res.data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Voice Search Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported on this browser. Please try Chrome or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      dispatch(setSearchOpen(false));
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectSuggestion = (title: string) => {
    dispatch(setSearchOpen(false));
    navigate(`/shop?search=${encodeURIComponent(title)}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in border border-gray-100">
        <form onSubmit={handleSearchSubmit} className="flex items-center px-4 py-3 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search return gifts, wedding favors, combos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-base text-gray-800 outline-none placeholder-gray-400 py-1"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-full mr-2 hover:bg-gray-50 transition-colors ${
              isListening ? 'text-rose-500 animate-pulse bg-rose-50' : 'text-gray-400'
            }`}
            title="Search by voice"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => dispatch(setSearchOpen(false))}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        <div className="p-5 max-h-[400px] overflow-y-auto">
          {/* Autocomplete Search suggestions */}
          {query.trim().length >= 2 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Search Suggestions</h3>
              {loading && <div className="text-sm text-gray-500 py-2">Searching...</div>}
              {!loading && results.length === 0 && (
                <div className="text-sm text-gray-500 py-2">No matching products found</div>
              )}
              <div className="space-y-1">
                {results.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      dispatch(setSearchOpen(false));
                      navigate(`/products/${prod.id}`);
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <img src={prod.image} alt={prod.title} className="w-10 h-10 object-cover rounded-md" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{prod.title}</p>
                      <p className="text-xs text-gold font-medium">₹{prod.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default Searches panel when query is empty */}
          {query.trim().length < 2 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  <Flame className="w-4 h-4 text-amber-500 mr-1.5" />
                  Trending Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSelectSuggestion(term)}
                      className="px-3.5 py-1.5 bg-gray-50 hover:bg-gold/10 hover:text-gold-hover border border-gray-100 rounded-full text-xs font-medium text-gray-600 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  <Sparkles className="w-4 h-4 text-gold mr-1.5" />
                  AI Suggested Prompts
                </div>
                <div className="space-y-2">
                  {AI_SUGGESTIONS.map((prompt) => (
                    <div
                      key={prompt}
                      onClick={() => {
                        setQuery(prompt.replace('Show ', '').replace('Curated ', ''));
                      }}
                      className="flex items-center text-xs font-medium text-gray-600 hover:text-gold cursor-pointer hover:bg-gray-50/50 p-2 rounded-lg transition-colors border border-dashed border-gray-100"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gold mr-2.5"></span>
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
