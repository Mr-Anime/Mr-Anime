<div class="modal fade premodal premodal-avatars" id="modalavatars" tabindex="-1" aria-labelledby="modalcharacterstitle" style="display: none;" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Choose Avatar</h5>
            </div>
            <div class="modal-body">
                <!-- Upload Section -->
                <div class="upload-section mb-3">
                    <label for="avatarUpload" class="btn btn-primary btn-block">Upload Your Own Avatar</label>
                    <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                    <div id="uploadPreview" class="profile-avatar mt-2" style="display: none;">
                        <img id="previewImage" src="#" alt="Uploaded Avatar" style="width: 100px; height: 100px; object-fit: cover;">
                    </div>
                </div>

                <ul class="nav nav-tabs pre-tabs pre-tabs-hashtag pre-tabs-min" style=margin-top:-5px>
                    <li class=nav-item><a class="nav-link active" data-toggle=tab href=#hashtag-1>#MyUploads</a>
                    <li class=nav-item><a class=nav-link data-toggle=tab href=#hashtag-16>#SpyFamily</a>
                    <li class=nav-item><a class=nav-link data-toggle=tab href=#hashtag-2>#DragonBall</a>
                    <li class=nav-item><a class=nav-link data-toggle=tab href=#hashtag-3>#OnePiece</a>
                    <li class=nav-item><a class=nav-link data-toggle=tab href=#hashtag-5>#HXH</a>
                    <li class=nav-item><a class=nav-link data-toggle=tab href=#hashtag-8>#Conan</a>
                    <li class=nav-item><a class=nav-link data-toggle=tab href=#hashtag-9>#Naruto</a>
                    <li class=nav-item><a class=nav-link data-toggle=tab href=#hashtag-12>#THA</a>
                    <li class=nav-item><a class=nav-link data-toggle=tab href=#hashtag-13>#DemonSlayer</a>
                    <li class=nav-item><a class=nav-link data-toggle=tab href=#hashtag-14>#JujutsuKaisen</a>
                    <li class=nav-item><a class=nav-link data-toggle=tab href=#hashtag-15>#ChainSaw</a>
                </ul>
                <div class=tab-content>
                    <div class="fade tab-pane show active" id=hashtag-1>
                        <div class=avatar-list id=my-uploads-list></div>
                    </div>
                    <div class="fade tab-pane" id=hashtag-2>
                        <div class=avatar-list>
                            <div class="item item-avatar" data-id=48>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar2-08.png></div>
                            </div>
                            <div class="item item-avatar" data-id=50>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar2-10.png></div>
                            </div>
                            <div class="item item-avatar" data-id=1>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball/av-db-01.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=2>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball/av-db-02.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=3>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball/av-db-03.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=4>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball/av-db-04.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=5>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball/av-db-05.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=6>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball/av-db-06.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=60>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/bulma.png></div>
                            </div>
                            <div class="item item-avatar" data-id=61>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/buumap.png></div>
                            </div>
                            <div class="item item-avatar" data-id=62>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/cell.png></div>
                            </div>
                            <div class="item item-avatar" data-id=63>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/freezer.png></div>
                            </div>
                            <div class="item item-avatar" data-id=64>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/gogeta.png></div>
                            </div>
                            <div class="item item-avatar" data-id=65>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/gohan.png></div>
                            </div>
                            <div class="item item-avatar" data-id=66>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/goku.png></div>
                            </div>
                            <div class="item item-avatar" data-id=67>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/goku-saiyan.png></div>
                            </div>
                            <div class="item item-avatar" data-id=68>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/gotenk.png></div>
                            </div>
                            <div class="item item-avatar" data-id=69>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/kaio.png></div>
                            </div>
                            <div class="item item-avatar" data-id=70>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/krillin.png></div>
                            </div>
                            <div class="item item-avatar" data-id=71>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/mabu.png></div>
                            </div>
                            <div class="item item-avatar" data-id=72>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/mrsatan.png></div>
                            </div>
                            <div class="item item-avatar" data-id=73>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/MutenRoshi.png></div>
                            </div>
                            <div class="item item-avatar" data-id=74>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/picolo.png></div>
                            </div>
                            <div class="item item-avatar" data-id=75>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/tenshihan.png></div>
                            </div>
                            <div class="item item-avatar" data-id=76>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/trunks.png></div>
                            </div>
                            <div class="item item-avatar" data-id=77>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/vegeta.png></div>
                            </div>
                            <div class="item item-avatar" data-id=78>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/videl.png></div>
                            </div>
                            <div class="item item-avatar" data-id=79>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/dragon_ball_chibi/beerus.png></div>
                            </div>
                        </div>
                    </div>
                    <div class="fade tab-pane" id=hashtag-3>
                        <div class=avatar-list>
                            <div class="item item-avatar" data-id=7>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/user-00.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=8>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/user-01.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=9>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/user-02.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=10>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/user-03.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=11>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/user-04.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=12>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/user-05.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=13>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/user-06.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=14>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/user-07.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=15>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/user-08.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=16>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/user-09.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=17>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/user-10.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=18>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/user-11.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=86>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/03.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=87>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/04.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=88>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/05.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=89>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/18.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=141>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/File1.png></div>
                            </div>
                            <div class="item item-avatar" data-id=142>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/File2.png></div>
                            </div>
                            <div class="item item-avatar" data-id=143>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/File3.png></div>
                            </div>
                            <div class="item item-avatar" data-id=144>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/File4.png></div>
                            </div>
                            <div class="item item-avatar" data-id=145>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/File5.png></div>
                            </div>
                            <div class="item item-avatar" data-id=146>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/File6.png></div>
                            </div>
                            <div class="item item-avatar" data-id=147>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/File7.png></div>
                            </div>
                            <div class="item item-avatar" data-id=148>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/one_piece/File8.png></div>
                            </div>
                            <div class="item item-avatar" data-id=19>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar-02.png></div>
                            </div>
                            <div class="item item-avatar" data-id=20>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar-03.png></div>
                            </div>
                            <div class="item item-avatar" data-id=21>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar-04.png></div>
                            </div>
                            <div class="item item-avatar" data-id=22>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar-05.png></div>
                            </div>
                            <div class="item item-avatar" data-id=23>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar-06.png></div>
                            </div>
                            <div class="item item-avatar" data-id=24>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar-08.png></div>
                            </div>
                            <div class="item item-avatar" data-id=25>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar-09.png></div>
                            </div>
                            <div class="item item-avatar" data-id=26>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar-10.png></div>
                            </div>
                            <div class="item item-avatar" data-id=39>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar-11.png></div>
                            </div>
                            <div class="item item-avatar" data-id=40>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar-12.png></div>
                            </div>
                            <div class="item item-avatar" data-id=27>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_normal/av-zz-01.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=28>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_normal/av-zz-02.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=29>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_normal/av-zz-03.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=30>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_normal/av-zz-04.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=31>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_normal/av-zz-05.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=32>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_normal/av-zz-06.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=33>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_normal/av-zz-07.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=34>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_normal/av-zz-08.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=35>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_normal/av-zz-09.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=36>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_normal/av-zz-10.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=37>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_normal/av-zz-11.jpeg></div>
                            </div>
                            <div class="item item-avatar" data-id=38>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_normal/av-zz-12.jpeg></div>
                            </div>
                        </div>
                    </div>
                    <div class="fade tab-pane" id=hashtag-4>
                        <div class=avatar-list></div>
                    </div>
                    <div class="fade tab-pane" id=hashtag-5>
                        <div class=avatar-list>
                            <div class="item item-avatar" data-id=41>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar2-01.png></div>
                            </div>
                            <div class="item item-avatar" data-id=46>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar2-06.png></div>
                            </div>
                            <div class="item item-avatar" data-id=51>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/mha/avatar-17.png></div>
                            </div>
                            <div class="item item-avatar" data-id=45>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar2-05.png></div>
                            </div>
                            <div class="item item-avatar" data-id=52>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/mha/avatar-18.png></div>
                            </div>
                            <div class="item item-avatar" data-id=53>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/mha/avatar-19.png></div>
                            </div>
                            <div class="item item-avatar" data-id=54>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/mha/avatar-20.png></div>
                            </div>
                            <div class="item item-avatar" data-id=55>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/mha/avatar-21.png></div>
                            </div>
                            <div class="item item-avatar" data-id=56>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/mha/avatar-22.png></div>
                            </div>
                            <div class="item item-avatar" data-id=57>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/mha/avatar-23.png></div>
                            </div>
                            <div class="item item-avatar" data-id=58>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/mha/avatar-24.png></div>
                            </div>
                            <div class="item item-avatar" data-id=59>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/mha/avatar-25.png></div>
                            </div>
                        </div>
                    </div>
                    <div class="fade tab-pane" id=hashtag-8>
                        <div class=avatar-list>
                            <div class="item item-avatar" data-id=81>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/conan/06.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=82>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/conan/07.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=120>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/conan/8.png></div>
                            </div>
                            <div class="item item-avatar" data-id=121>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/conan/9.png></div>
                            </div>
                            <div class="item item-avatar" data-id=122>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/conan/10.png></div>
                            </div>
                            <div class="item item-avatar" data-id=123>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/conan/11.png></div>
                            </div>
                            <div class="item item-avatar" data-id=124>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/conan/12.png></div>
                            </div>
                            <div class="item item-avatar" data-id=125>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/conan/13.png></div>
                            </div>
                            <div class="item item-avatar" data-id=126>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/conan/14.png></div>
                            </div>
                        </div>
                    </div>
                    <div class="fade tab-pane" id=hashtag-9>
                        <div class=avatar-list>
                            <div class="item item-avatar" data-id=43>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar2-03.png></div>
                            </div>
                            <div class="item item-avatar" data-id=44>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar2-04.png></div>
                            </div>
                            <div class="item item-avatar" data-id=83>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/naruto/08.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=47>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar2-07.png></div>
                            </div>
                            <div class="item item-avatar" data-id=49>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/zoro_chibi/avatar2-09.png></div>
                            </div>
                            <div class="item item-avatar" data-id=84>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/naruto/09.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=85>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/naruto/11.jpg></div>
                            </div>
                        </div>
                    </div>
                    <div class="fade tab-pane" id=hashtag-12>
                        <div class=avatar-list>
                            <div class="item item-avatar" data-id=92>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/tha/01.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=93>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/tha/02.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=94>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/tha/12.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=95>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/tha/13.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=96>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/tha/15.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=97>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/tha/16.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=98>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/tha/17.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=99>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/tha/19.jpg></div>
                            </div>
                        </div>
                    </div>
                    <div class="fade tab-pane show" id=hashtag-13>
                        <div class=avatar-list>
                            <div class="item item-avatar" data-id=100>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File1.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=101>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File2.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=102>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File3.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=103>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File4.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=104>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File5.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=105>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File6.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=106>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File7.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=107>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File8.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=108>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File9.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=109>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File10.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=110>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File11.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=111>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File12.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=112>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File13.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=113>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File14.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=114>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File15.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=115>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File16.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=116>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File17.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=117>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File18.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=118>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File19.jpg></div>
                            </div>
                            <div class="item item-avatar" data-id=119>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/demon_splayer/File20.jpg></div>
                            </div>
                        </div>
                    </div>
                    <div class="fade tab-pane" id=hashtag-14>
                        <div class=avatar-list>
                            <div class="item item-avatar" data-id=127>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File1.png></div>
                            </div>
                            <div class="item item-avatar" data-id=128>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File2.png></div>
                            </div>
                            <div class="item item-avatar" data-id=129>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File3.png></div>
                            </div>
                            <div class="item item-avatar" data-id=130>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File4.png></div>
                            </div>
                            <div class="item item-avatar" data-id=131>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File5.png></div>
                            </div>
                            <div class="item item-avatar" data-id=132>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File6.png></div>
                            </div>
                            <div class="item item-avatar" data-id=133>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File7.png></div>
                            </div>
                            <div class="item item-avatar" data-id=134>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File8.png></div>
                            </div>
                            <div class="item item-avatar" data-id=135>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File9.png></div>
                            </div>
                            <div class="item item-avatar" data-id=136>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File10.png></div>
                            </div>
                            <div class="item item-avatar" data-id=137>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File11.png></div>
                            </div>
                            <div class="item item-avatar" data-id=138>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File12.png></div>
                            </div>
                            <div class="item item-avatar" data-id=139>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File13.png></div>
                            </div>
                            <div class="item item-avatar" data-id=140>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/jujutsu_kaisen/File14.png></div>
                            </div>
                        </div>
                    </div>
                    <div class="fade tab-pane" id=hashtag-15>
                        <div class=avatar-list>
                            <div class="item item-avatar" data-id=149>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/chainsaw/01.png></div>
                            </div>
                            <div class="item item-avatar" data-id=150>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/chainsaw/02.png></div>
                            </div>
                            <div class="item item-avatar" data-id=151>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/chainsaw/03.png></div>
                            </div>
                            <div class="item item-avatar" data-id=152>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/chainsaw/04.png></div>
                            </div>
                            <div class="item item-avatar" data-id=153>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/chainsaw/05.png></div>
                            </div>
                            <div class="item item-avatar" data-id=154>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/chainsaw/06.png></div>
                            </div>
                            <div class="item item-avatar" data-id=155>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/chainsaw/07.png></div>
                            </div>
                            <div class="item item-avatar" data-id=156>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/chainsaw/08.png></div>
                            </div>
                            <div class="item item-avatar" data-id=157>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/chainsaw/09.png></div>
                            </div>
                        </div>
                    </div>
                    <div class="fade tab-pane" id=hashtag-16>
                        <div class=avatar-list>
                            <div class="item item-avatar" data-id=158>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/01.png></div>
                            </div>
                            <div class="item item-avatar" data-id=159>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/02.png></div>
                            </div>
                            <div class="item item-avatar" data-id=160>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/03.png></div>
                            </div>
                            <div class="item item-avatar" data-id=161>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/04.png></div>
                            </div>
                            <div class="item item-avatar" data-id=162>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/05.png></div>
                            </div>
                            <div class="item item-avatar" data-id=163>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/06.png></div>
                            </div>
                            <div class="item item-avatar" data-id=164>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/07.png></div>
                            </div>
                            <div class="item item-avatar" data-id=165>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/08.png></div>
                            </div>
                        </div>
                    </div>
                    <div class="fade tab-pane" id=hashtag-17>
                        <div class=avatar-list>
                            <div class="item item-avatar" data-id=158>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/01.png></div>
                            </div>
                            <div class="item item-avatar" data-id=159>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/02.png></div>
                            </div>
                            <div class="item item-avatar" data-id=160>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/03.png></div>
                            </div>
                            <div class="item item-avatar" data-id=161>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/04.png></div>
                            </div>
                            <div class="item item-avatar" data-id=162>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/05.png></div>
                            </div>
                            <div class="item item-avatar" data-id=163>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/06.png></div>
                            </div>
                            <div class="item item-avatar" data-id=164>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/07.png></div>
                            </div>
                            <div class="item item-avatar" data-id=165>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/08.png></div>
                            </div>
                            <div class="item item-avatar" data-id=165>
                                <div class=checked><i class="fa-check fas"></i></div>
                                <div class=profile-avatar><img src=<?= $websiteUrl ?>/public/avatar/100x100/spy_family/08.png></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="clearfix"></div>

                <a data-dismiss="modal" aria-label="Close" class="btn btn-block btn-secondary mt-4">Close</a>
            </div>
        </div>
    </div>
</div>