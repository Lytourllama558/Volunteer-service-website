import { Search } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

type HeroProps = {
  onBrowse: () => void;
};

export function Hero({ onBrowse }: HeroProps) {
  return (
    <div className="relative bg-gradient-to-r from-red-500 to-pink-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-white mb-6" font-size="5xl">
              以志愿之名，赴美好之约
            </h1>
            <p className="text-red-50 mb-8">
              加入百万志愿者的温暖阵营，用每一次行动，让世界向光生长。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onBrowse}
                className="bg-white text-red-500 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 shadow-md"
              >
                <Search size={20} />
                寻找志愿活动
              </button>
              <button 
                onClick={onBrowse}
                className="border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-red-500/90 bg-white/5 backdrop-blur"
              >
                立即浏览
              </button>
            </div>
          </div>
          <div className="relative">
            <ImageWithFallback
              src="/src/image/02.jpg"
              alt="志愿者一起工作"
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}