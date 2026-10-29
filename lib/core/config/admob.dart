import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
import 'dart:async';

class AdmobHandler {
  // 싱글톤 구현
  static final AdmobHandler _instance = AdmobHandler._internal();
  factory AdmobHandler() => _instance;
  AdmobHandler._internal();

  // 상태 업데이트 콜백
  void Function()? _onBannerStateChanged;

  // 광고 활성화 여부
  static bool isAdEnabled = true;

  // 광고 상태 관리
  BannerAd? _bannerAd;
  InterstitialAd? _interstitialAd;
  bool _isInterstitialAdLoaded = false;
  RewardedAd? _rewardedAd;

  // 광고 단위 ID 상수
  // 디버그 모드 테스트 광고 ID
  static const String _debugBannerAdUnitIdAndroid =
      'ca-app-pub-3940256099942544/9214589741';
  static const String _debugBannerAdUnitIdIOS =
      'ca-app-pub-3940256099942544/2435281174';
  static const String _debugInterstitialAdUnitIdAndroid =
      'ca-app-pub-3940256099942544/1033173712';
  static const String _debugInterstitialAdUnitIdIOS =
      'ca-app-pub-3940256099942544/4411468910';
  static const String _debugRewardedAdUnitIdAndroid =
      'ca-app-pub-3940256099942544/5224354917';
  static const String _debugRewardedAdUnitIdIOS =
      'ca-app-pub-3940256099942544/1712485313';

  // 프로덕션 모드 광고 ID
  // 배너는 아직 실제 ID가 없어 비워 둔다. 빈 ID면 로드를 건너뛴다.
  static const String _prodBannerAdUnitIdAndroid = '';
  static const String _prodBannerAdUnitIdIOS = '';
  static const String _prodInterstitialAdUnitIdAndroid =
      'ca-app-pub-1544792491473261/6722114497';
  static const String _prodInterstitialAdUnitIdIOS =
      'ca-app-pub-1544792491473261/9300176372';
  // 보상형 광고의 AdMob 보상 항목은 'retry'(이어하기)다.
  static const String _prodRewardedAdUnitIdAndroid =
      'ca-app-pub-1544792491473261/1613258043';
  static const String _prodRewardedAdUnitIdIOS =
      'ca-app-pub-1544792491473261/7843624477';

  // 지원되는 플랫폼인지 확인
  bool get _isSupported {
    return Platform.isIOS || Platform.isAndroid;
  }

  // 배너 광고 ID 가져오기
  String get _bannerAdUnitId {
    if (!_isSupported) {
      isAdEnabled = false;
      return '';
    }

    if (kDebugMode) {
      if (Platform.isAndroid) {
        return _debugBannerAdUnitIdAndroid;
      }
      if (Platform.isIOS) {
        return _debugBannerAdUnitIdIOS;
      }
    }

    if (Platform.isAndroid) {
      return _prodBannerAdUnitIdAndroid;
    }
    if (Platform.isIOS) {
      return _prodBannerAdUnitIdIOS;
    }

    return '';
  }

  // 전면 광고 ID 가져오기
  String get _interstitialAdUnitId {
    if (!_isSupported) {
      isAdEnabled = false;
      return '';
    }

    if (kDebugMode) {
      if (Platform.isAndroid) {
        return _debugInterstitialAdUnitIdAndroid;
      }
      if (Platform.isIOS) {
        return _debugInterstitialAdUnitIdIOS;
      }
    }

    if (Platform.isAndroid) {
      return _prodInterstitialAdUnitIdAndroid;
    }
    if (Platform.isIOS) {
      return _prodInterstitialAdUnitIdIOS;
    }

    return '';
  }

  // 보상형 광고 ID 가져오기
  String get _rewardedAdUnitId {
    if (!_isSupported) {
      isAdEnabled = false;
      return '';
    }

    if (kDebugMode) {
      if (Platform.isAndroid) {
        return _debugRewardedAdUnitIdAndroid;
      }
      if (Platform.isIOS) {
        return _debugRewardedAdUnitIdIOS;
      }
    }

    if (Platform.isAndroid) {
      return _prodRewardedAdUnitIdAndroid;
    }
    if (Platform.isIOS) {
      return _prodRewardedAdUnitIdIOS;
    }

    return '';
  }

  // 초기화
  Future<void> initialize() async {
    if (!_isSupported) {
      isAdEnabled = false;
      return;
    }

    try {
      await MobileAds.instance.initialize();
      _loadBannerAd();
    } catch (e) {
      debugPrint('AdMob 초기화 실패: $e');
      isAdEnabled = false;
    }
  }

  // 상태 업데이트 콜백 설정
  void setBannerCallback(void Function() callback) {
    _onBannerStateChanged = callback;
  }

  // 상태 업데이트 알림
  void _notifyBannerStateChanged() {
    _onBannerStateChanged?.call();
  }

  // 배너 광고 위젯
  Widget getBannerAd() {
    if (!isAdEnabled || _bannerAd == null) {
      return const SizedBox(height: 50);
    }

    return SizedBox(
      width: _bannerAd!.size.width.toDouble(),
      height: _bannerAd!.size.height.toDouble(),
      child: AdWidget(ad: _bannerAd!),
    );
  }

  // 배너 광고 로드
  void _loadBannerAd() {
    final adUnitId = _bannerAdUnitId;
    if (adUnitId.isEmpty) return;

    _bannerAd = BannerAd(
      size: AdSize.banner,
      adUnitId: adUnitId,
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          debugPrint('배너 광고 로드 완료');
          _notifyBannerStateChanged(); // 상태 변경 알림
        },
        onAdFailedToLoad: (ad, error) {
          debugPrint('배너 광고 로드 실패: $error');
          ad.dispose();
          _bannerAd = null;
          _notifyBannerStateChanged(); // 상태 변경 알림
        },
      ),
      request: const AdRequest(),
    );

    _bannerAd?.load();
  }

  // 전면 광고 로드
  Future<void> loadInterstitialAd() async {
    if (!isAdEnabled) return;

    final completer = Completer<void>();

    await InterstitialAd.load(
      adUnitId: _interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
          _isInterstitialAdLoaded = true;
          completer.complete();
        },
        onAdFailedToLoad: (error) {
          _isInterstitialAdLoaded = false;
          completer.completeError(error);
        },
      ),
    );

    return completer.future;
  }

  // 다음 광고 미리 로드 (대기하지 않음)
  void preloadNextAd() {
    if (!isAdEnabled) return;

    InterstitialAd.load(
      adUnitId: _interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
          _isInterstitialAdLoaded = true;
        },
        onAdFailedToLoad: (error) {
          _isInterstitialAdLoaded = false;
          debugPrint('다음 광고 로드 실패: $error');
        },
      ),
    );
  }

  // 전면 광고 표시
  Future<void> showInterstitialAd() async {
    if (!isAdEnabled || !_isInterstitialAdLoaded) {
      return;
    }

    _interstitialAd?.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _isInterstitialAdLoaded = false;
        preloadNextAd(); // 다음 광고 미리 로드 (non-blocking)
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        _isInterstitialAdLoaded = false;
        preloadNextAd(); // 실패해도 다음 광고 미리 로드
      },
    );

    await _interstitialAd?.show();
  }

  // 보상형 광고 미리 로드 (대기하지 않음)
  void preloadRewardedAd() {
    if (!isAdEnabled) return;

    final adUnitId = _rewardedAdUnitId;
    if (adUnitId.isEmpty) return;

    RewardedAd.load(
      adUnitId: adUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          debugPrint('보상형 광고 로드 완료');
          _rewardedAd = ad;
        },
        onAdFailedToLoad: (error) {
          debugPrint('보상형 광고 로드 실패: $error');
          _rewardedAd = null;
        },
      ),
    );
  }

  // 보상형 광고 표시. 광고가 준비되지 않았으면 false를 돌려준다.
  // 끝까지 시청하면 onUserEarnedReward가 불린다.
  Future<bool> showRewardedAd({
    required void Function() onUserEarnedReward,
  }) async {
    final ad = _rewardedAd;
    if (!isAdEnabled || ad == null) {
      return false;
    }
    _rewardedAd = null;

    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        preloadRewardedAd(); // 다음 광고 미리 로드 (non-blocking)
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        preloadRewardedAd(); // 실패해도 다음 광고 미리 로드
      },
    );

    await ad.show(onUserEarnedReward: (_, _) => onUserEarnedReward());
    return true;
  }

  // 리소스 정리
  void dispose() {
    _interstitialAd?.dispose();
    _rewardedAd?.dispose();
    _bannerAd?.dispose();
  }
}
